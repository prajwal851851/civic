from rest_framework.permissions import BasePermission


class IsCommentAuthor(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsOfficialOrAuthor(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method == "PATCH":
            return obj.user == request.user
        return obj.user == request.user or request.user.role == "official"
