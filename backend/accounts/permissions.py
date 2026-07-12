from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj == request.user


class IsNotDeleted(BasePermission):
    message = "Account is scheduled for deletion."

    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated and user.is_deleted:
            return False
        return True
