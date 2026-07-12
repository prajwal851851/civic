import json

from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from realtime.consumers import NotificationConsumer


class NotificationConsumerTests(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            full_name="Test User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.access_token = str(RefreshToken.for_user(self.user).access_token)

    async def _make_communicator(self, token=None):
        comm = WebsocketCommunicator(
            NotificationConsumer.as_asgi(), "/ws/notifications/"
        )
        if token:
            comm.scope["query_string"] = f"token={token}".encode()
        connected, _ = await comm.connect()
        return connected, comm

    async def test_authenticated_connects(self):
        connected, comm = await self._make_communicator(token=self.access_token)
        self.assertTrue(connected)
        await comm.disconnect()

    async def test_anonymous_rejected(self):
        connected, _ = await self._make_communicator(token=None)
        self.assertFalse(connected)

    async def test_echo_message(self):
        connected, comm = await self._make_communicator(token=self.access_token)
        self.assertTrue(connected)
        await comm.send_to(text_data=json.dumps({"message": "hello"}))
        response = await comm.receive_from()
        self.assertEqual(response, json.dumps({"message": "hello"}))
        await comm.disconnect()

    async def test_disconnect(self):
        connected, comm = await self._make_communicator(token=self.access_token)
        self.assertTrue(connected)
        await comm.disconnect()
