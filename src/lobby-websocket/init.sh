#!/bin/sh

LOBBY_API_URL="http://lobby_api:8002"

# Wait until lobby_api is ready
echo "Waiting for lobby_api to become available..."

# Continuously check if the lobby_api responds
until curl -s $LOBBY_API_URL; do
    echo "lobby_api not ready, retrying in 2 seconds..."
    sleep 2
done

echo "lobby_api is ready."

# Run the websocket service (Daphne)
echo "Starting the WebSocket service..."
# Start the Django server after PostgreSQL is ready
echo "Running migrations..."
python manage.py migrate

exec "$@"