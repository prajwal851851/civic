from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts import views

urlpatterns = [
    path("signup/", views.CitizenSignupView.as_view(), name="citizen-signup"),
    path("signup/official/", views.OfficialSignupView.as_view(), name="official-signup"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", views.CurrentUserView.as_view(), name="current-user"),
    path("me/upload-photo/", views.UserPhotoUploadView.as_view(), name="user-photo-upload"),
    path("me/delete-photo/", views.UserPhotoDeleteView.as_view(), name="user-photo-delete"),
    path("password-reset/", views.RequestPasswordResetView.as_view(), name="password-reset"),
    path("password-reset/confirm/", views.ConfirmPasswordResetView.as_view(), name="password-reset-confirm"),
    path("me/emails/", views.ListEmailsView.as_view(), name="list-emails"),
    path("me/emails/add/", views.RequestAddEmailView.as_view(), name="request-add-email"),
    path("me/emails/verify/", views.VerifyAddEmailView.as_view(), name="verify-add-email"),
    path("me/emails/remove/", views.RequestRemoveEmailView.as_view(), name="request-remove-email"),
    path("me/emails/remove/confirm/", views.ConfirmRemoveEmailView.as_view(), name="confirm-remove-email"),
    path("me/username/check/", views.CheckUsernameView.as_view(), name="check-username"),
    path("me/username/", views.UpdateUsernameView.as_view(), name="update-username"),
    path("me/delete/", views.DeleteAccountView.as_view(), name="delete-account"),
    path("me/delete/confirm/", views.ConfirmDeleteAccountView.as_view(), name="confirm-delete-account"),
    path("me/delete/cancel/", views.CancelDeleteAccountView.as_view(), name="cancel-delete-account"),
    path("me/delete/recover/", views.RecoverAccountView.as_view(), name="recover-account"),
    path("me/delete/recover/confirm/", views.ConfirmRecoverAccountView.as_view(), name="confirm-recover-account"),
    path("profile/<int:pk>/", views.PublicProfileView.as_view(), name="public-profile"),
]
