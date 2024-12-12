from channels.generic.websocket import AsyncWebsocketConsumer
import json
import httpx

class LobbyConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.lobby_id = self.scope['url_route']['kwargs']['lobby_id']
        self.user_name = self.scope["url_route"]["kwargs"]["user_name"]
        self.lobby_group_name = f"lobby_{self.lobby_id}"

        await self.channel_layer.group_add(
            self.lobby_group_name,
            self.channel_name
        )

        await self.player_joined()

        await self.accept()

    async def disconnect(self, close_code):
        # Remove the user from the lobby group
        await self.channel_layer.group_discard(
            self.lobby_group_name,
            self.channel_name
        )

        await self.cleanup_role()
        await self.player_left()
        group_members = await self.channel_layer.group_channels(self.lobby_group_name)
        if not group_members:
            await self.delete_lobby_entry()
            

    async def receive(self, text_data):
        # Handle messages from the WebSocket
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'p1_select':
            await self.assign_role('p1')
        elif action == 'p1_deselect':
            await self.unassign_role('p1')
        elif action == 'p2_select':
            await self.assign_role('p2')
        elif action == 'p2_deselect':
            await self.unassign_role('p2')
        elif action == 'start_game':
            # Broadcast game start to the lobby
            await self.channel_layer.group_send(
                self.lobby_group_name,
                {
                    'type': 'start_game',
                    'message': 'ok'
                }
            )
        if self.roles['p1'] and self.roles['p2']:
            await self.channel_layer.group_send(
                self.lobby_group_name,
                {
                    'type': 'enable_start_button',
                    'message' : 'ok'
                }
            )

    async def start_game(self, event):
        await self.send(text_data=json.dumps({
            'type': 'start_game',
            'message': event['message']
        }))
    async def enable_start_button(self, event):
        await self.send(text_data=json.dumps({
            'type': 'enable_start_button',
            'message' : event['message']
        }))

    async def assign_role(self, role):
        url = f"http://lobby_api:8002/lobby/{role}/{self.lobby_id}/{self.user_name}"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data={'key': 'value'})
            if response.status_code != 200:
                print(f"Failed to leave lobby {self.lobby_id}: {response.text}") 
        roles = response.json() 
        await self.update_roles(roles)

    async def update_roles(self, roles):
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                'type': 'send_update_roles',
                'roles': roles,
            }
        )

    async def send_update_roles(self, event):
        # Send updated roles to this WebSocket
        await self.send(text_data=json.dumps({
            'type': 'update_roles',
            'roles': event['roles'],
        }))

    async def player_joined(self):
        url = f"http://lobby_api:8002/lobby/player_joined/{self.lobby_id}/"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data={'key': 'value'})
            if response.status_code != 200:
                print(f"Failed to join lobby {self.lobby_id}: {response.text}")
    
    async def player_left(self):
        url = f"http://lobby_api:8002/lobby/player_left/{self.lobby_id}/{self.user_name}/"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data={'key': 'value'})
            if response.status_code != 200:
                print(f"Failed to leave lobby {self.lobby_id}: {response.text}")
            roles = response.json()
            await self.update_roles(roles)

    async def delete_lobby_entry(self):
        url = f"http://lobby_api:8002/lobby/delete/{self.lobby_id}/"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data={'key': 'value'})
            if response.status_code != 200:
                print(f"Failed to delete lobby {self.lobby_id}: {response.text}")
