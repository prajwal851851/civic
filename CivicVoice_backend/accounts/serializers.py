from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth import authenticate

from accounts.models import ExtraEmail, PasswordReset, User
from reports.models import Report


class CitizenSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "email",
            "full_name",
            "password",
            "confirm_password",
            "phone_number",
            "municipality",
            "ward_number",
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        attrs["municipality"] = "Kathmandu"
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        validated_data["role"] = User.Role.CITIZEN
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password", "")

        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )
        if not user:
            try:
                deleted_user = User.objects.get(email=email, is_deleted=True)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password.")
            if not deleted_user.check_password(password):
                raise serializers.ValidationError("Invalid email or password.")
            if deleted_user.deleted_at and timezone.now() > deleted_user.deleted_at:
                deleted_user.delete()
                raise serializers.ValidationError(
                    "Account has been permanently deleted."
                )
            user = deleted_user
        elif not user.is_active:
            raise serializers.ValidationError("Account is deactivated.")

        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "full_name",
            "phone_number",
            "municipality",
            "ward_number",
            "profile_picture",
            "cover_photo",
            "bio",
            "role",
            "reputation_points",
            "is_verified",
            "is_deleted",
            "deleted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "username",
            "role",
            "reputation_points",
            "is_verified",
            "is_deleted",
            "deleted_at",
            "created_at",
            "updated_at",
        ]


class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower().strip()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


class ConfirmPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        return value.lower().strip()

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        try:
            reset = (
                PasswordReset.objects.filter(
                    email=attrs["email"], code=attrs["code"], is_used=False
                )
                .latest("created_at")
            )
        except PasswordReset.DoesNotExist:
            raise serializers.ValidationError(
                {"code": "Invalid or expired reset code."}
            )
        if reset.is_expired():
            raise serializers.ValidationError(
                {"code": "Reset code has expired. Please request a new one."}
            )
        attrs["reset"] = reset
        return attrs


class AddEmailRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower().strip()
        user = self.context["request"].user
        if value == user.email:
            raise serializers.ValidationError("This is already your primary email.")
        if ExtraEmail.objects.filter(user=user, email=value).exists():
            raise serializers.ValidationError("This email is already added.")
        return value


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)


class RemoveEmailRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ConfirmRemoveEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)


class CheckUsernameSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)


class UpdateUsernameSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)

    def validate_username(self, value):
        if (
            User.objects.filter(username__iexact=value)
            .exclude(id=self.context["request"].user.id)
            .exists()
        ):
            raise serializers.ValidationError("This username is already taken.")
        return value


class PublicProfileSerializer(serializers.ModelSerializer):
    report_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "profile_picture",
            "cover_photo",
            "bio",
            "municipality",
            "ward_number",
            "reputation_points",
            "is_verified",
            "created_at",
            "report_count",
        ]

    def get_report_count(self, obj):
        return Report.objects.filter(citizen=obj).count()
