from rest_framework.permissions import BasePermission


class IsCitizen(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "citizen"


class IsOfficial(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "official"


class IsReportOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.citizen == request.user
