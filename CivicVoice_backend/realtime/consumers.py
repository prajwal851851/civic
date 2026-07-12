import json

from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from accounts.models import User


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.scope["query_string"].decode()
        if token.startswith("token="):
            token = token.removeprefix("token=")

        if not token:
            await self.close(code=4001)
            return

        try:
            access = AccessToken(token)
            user = await User.objects.aget(id=access["user_id"])
            self.scope["user"] = user
        except (TokenError, User.DoesNotExist):
            await self.close(code=4001)
            return

        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        await self.send(text_data=json.dumps(data))
