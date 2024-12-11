FROM python:3.13.0-slim-bookworm

RUN apt-get update && apt-get install -y postgresql-client iputils-ping curl
#to ping the database, so that it not initiated before db is rdy

COPY . .

RUN pip install -r requirements.txt

RUN chmod +x /init.sh

# Run the script to wait for PostgreSQL and then start Django
ENTRYPOINT ["/init.sh"]

CMD ["gunicorn", "app.wsgi:application", "--bind", "0.0.0.0:8002"]