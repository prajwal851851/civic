import random
from datetime import timedelta

from cloudinary import uploader
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ExtraEmail, PasswordReset, User
from accounts.permissions import IsNotDeleted, IsOwner
from accounts.serializers import (
    AddEmailRequestSerializer,
    CheckUsernameSerializer,
    CitizenSignupSerializer,
    ConfirmPasswordResetSerializer,
    ConfirmRemoveEmailSerializer,
    LoginSerializer,
    OfficialSignupSerializer,
    PublicProfileSerializer,
    RemoveEmailRequestSerializer,
    RequestPasswordResetSerializer,
    UpdateUsernameSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)


class CitizenSignupView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = CitizenSignupSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class OfficialSignupView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = OfficialSignupSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        data = {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
        if user.is_deleted:
            data["is_scheduled_for_deletion"] = True
            data["deleted_at"] = (
                user.deleted_at.isoformat() if user.deleted_at else None
            )
        return Response(data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_200_OK,
            )
        except TokenError:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CurrentUserView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_object(self):
        return self.request.user


class UserPhotoUploadView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        photo_type = request.data.get("type")
        file = request.FILES.get("file")

        if photo_type not in ("profile", "cover"):
            return Response(
                {"detail": "Invalid type. Must be 'profile' or 'cover'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not file:
            return Response(
                {"detail": "No file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed:
            return Response(
                {"detail": f"Invalid file type '{file.content_type}'. Allowed: jpg, jpeg, png, webp."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > 10 * 1024 * 1024:
            return Response(
                {"detail": "File exceeds 10 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            folder = "profile_pictures" if photo_type == "profile" else "cover_photos"
            result = uploader.upload(file, folder=folder)
            url = result.get("secure_url") or result.get("url")

            user = request.user
            if photo_type == "profile":
                user.profile_picture = url
            else:
                user.cover_photo = url
            user.save(update_fields=["profile_picture" if photo_type == "profile" else "cover_photo"])

            return Response({"url": url}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserPhotoDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]

    def delete(self, request):
        photo_type = request.data.get("type")

        if photo_type not in ("profile", "cover"):
            return Response(
                {"detail": "Invalid type. Must be 'profile' or 'cover'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        field = "profile_picture" if photo_type == "profile" else "cover_photo"
        setattr(user, field, "")
        user.save(update_fields=[field])

        return Response({"detail": f"{photo_type.capitalize()} photo removed."}, status=status.HTTP_200_OK)


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data["email"]
        code = str(random.randint(100000, 999999))
        PasswordReset.objects.create(email=email, code=code)
        return Response(
            {
                "detail": "A 6-digit reset code has been sent to your email.",
                "code": code,
            },
            status=status.HTTP_200_OK,
        )


class ConfirmPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmPasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        reset = serializer.validated_data["reset"]
        user = User.objects.get(email=serializer.validated_data["email"])
        user.set_password(serializer.validated_data["password"])
        user.save()
        reset.is_used = True
        reset.save()
        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )


class ListEmailsView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]

    def get(self, request):
        extras = ExtraEmail.objects.filter(user=request.user)
        return Response({
            "primary": request.user.email,
            "extra": [{"id": e.id, "email": e.email} for e in extras],
        })


class RequestAddEmailView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]

    def post(self, request):
        serializer = AddEmailRequestSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        return Response({
            "detail": "Verification code sent to your email.",
            "code": "123456",
        })


class VerifyAddEmailView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()
        code = serializer.validated_data["code"]

        if code != "123456":
            return Response(
                {"detail": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if email == request.user.email:
            return Response(
                {"detail": "This is already your primary email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ExtraEmail.objects.filter(user=request.user, email=email).exists():
            return Response(
                {"detail": "This email is already added."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ExtraEmail.objects.create(user=request.user, email=email, is_verified=True)
        return Response({"detail": "Email added successfully."})


class RequestRemoveEmailView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]

    def post(self, request):
        serializer = RemoveEmailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()

        if email == request.user.email:
            return Response(
                {"detail": "Cannot remove your primary email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not ExtraEmail.objects.filter(user=request.user, email=email).exists():
            return Response(
                {"detail": "Email not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "detail": "Verification code sent to your mobile number.",
            "code": "123456",
        })


class ConfirmRemoveEmailView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]

    def post(self, request):
        serializer = ConfirmRemoveEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()
        code = serializer.validated_data["code"]

        if code != "123456":
            return Response(
                {"detail": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        extra = ExtraEmail.objects.filter(user=request.user, email=email).first()
        if not extra:
            return Response(
                {"detail": "Email not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        extra.delete()
        return Response({"detail": "Email removed successfully."})


class CheckUsernameView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]

    def post(self, request):
        serializer = CheckUsernameSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        taken = (
            User.objects.filter(username__iexact=username)
            .exclude(id=request.user.id)
            .exists()
        )
        return Response({"available": not taken, "username": username})


class UpdateUsernameView(APIView):
    permission_classes = [IsAuthenticated, IsNotDeleted]

    def patch(self, request):
        serializer = UpdateUsernameSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.username = serializer.validated_data["username"]
        request.user.save(update_fields=["username"])
        return Response(UserSerializer(request.user).data)


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_deleted:
            return Response(
                {"detail": "Account is already scheduled for deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({
            "detail": "A 6-digit verification code has been sent to your phone number.",
            "code": "123456",
        })


class ConfirmDeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code", "")
        if code != "123456":
            return Response(
                {"detail": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        if user.is_deleted:
            return Response(
                {"detail": "Account is already scheduled for deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_deleted = True
        user.deleted_at = timezone.now() + timedelta(days=7)
        user.save(update_fields=["is_deleted", "deleted_at"])
        return Response({
            "detail": "Account scheduled for deletion. You have 7 days to cancel by logging in and visiting your profile settings.",
        })


class CancelDeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_deleted:
            return Response(
                {"detail": "Account is not scheduled for deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_deleted = False
        user.deleted_at = None
        user.save(update_fields=["is_deleted", "deleted_at"])
        return Response({"detail": "Account deletion cancelled."})


class RecoverAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_deleted:
            return Response(
                {"detail": "Account is not scheduled for deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({
            "detail": "A 6-digit verification code has been sent to your phone number.",
            "code": "123456",
        })


class ConfirmRecoverAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code", "")
        if code != "123456":
            return Response(
                {"detail": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        if not user.is_deleted:
            return Response(
                {"detail": "Account is not scheduled for deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_deleted = False
        user.deleted_at = None
        user.save(update_fields=["is_deleted", "deleted_at"])
        return Response({
            "detail": "Account recovered successfully. Welcome back!",
        })


class PublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_deleted=False)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PublicProfileSerializer(user)
        return Response(serializer.data)
