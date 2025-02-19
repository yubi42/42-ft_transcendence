#!/bin/sh

echo "Waiting for PostgreSQL..."
while ! nc -z $USERDATA_DB_NAME $USERDATA_DB_PORT; do
    sleep 0.2
done
echo "PostgreSQL started"

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