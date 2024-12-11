#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h "$POSTGRES_DB" -p "$PGPORT" -U "$POSTGRES_USER"; do
    sleep 1
done
echo "PostgreSQL is ready!"

# Start the Django server after PostgreSQL is ready
echo "Running migrations..."
python manage.py makemigrations app
python manage.py migrate

exec "$@"