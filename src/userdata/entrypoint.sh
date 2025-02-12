#!/bin/sh
set -e

if [ "$DATABASE" = "postgres" ]; then
    echo "Waiting for postgres..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
        sleep 0.1
    done

    echo "PostgreSQL started"
fi

echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Creating test user..."
python manage.py shell -c "from django.contrib.auth import get_user_model; \
User = get_user_model(); \
user, created = User.objects.get_or_create(username='pi', defaults={'email': 'pi@pi.de', 'is_superuser': True, 'is_staff': True}); \
user.set_password('pi'); \
user.save(); \
print('Test user \"pi\" created or updated.')"

exec "$@"
