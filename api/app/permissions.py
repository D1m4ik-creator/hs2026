from rest_framework.permissions import BasePermission


def _user_roles(user):
    return set(getattr(user, "roles", []) or [])


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return 'admin' in _user_roles(request.user)

class IsHost(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        roles = _user_roles(request.user)
        return 'host' in roles or 'admin' in roles

class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            not request.user.is_deleted
        )
