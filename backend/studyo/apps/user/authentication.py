from django.utils import timezone
from rest_framework import authentication, exceptions

from .models import AuthToken


class ExpiringTokenAuthentication(authentication.BaseAuthentication):
    keyword = "Token"

    def authenticate(self, request):
        auth = authentication.get_authorization_header(request).split()
        if not auth:
            return None

        if auth[0].lower() != self.keyword.lower().encode():
            return None

        if len(auth) == 1:
            raise exceptions.AuthenticationFailed("Invalid token header. No credentials provided.")
        if len(auth) > 2:
            raise exceptions.AuthenticationFailed("Invalid token header. Token string should not contain spaces.")

        try:
            key = auth[1].decode()
        except UnicodeError:
            raise exceptions.AuthenticationFailed("Invalid token header. Token string should be valid UTF-8.")

        try:
            token = AuthToken.objects.select_related("user").get(key=key)
        except AuthToken.DoesNotExist:
            raise exceptions.AuthenticationFailed("Invalid or expired token.")

        if not token.is_active or token.expires_at <= timezone.now():
            token.mark_inactive(reason="expired")
            raise exceptions.AuthenticationFailed("Invalid or expired token.")

        token.register_activity()
        return (token.user, token)
