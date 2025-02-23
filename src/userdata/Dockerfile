# -----------------------------------------
# STAGE 1: Builder
# -----------------------------------------
    FROM python:3.10-slim-buster AS builder

    # Set working directory
    WORKDIR /usr/src/app
    
    # Set environment variables to prevent Python from writing .pyc files and enable unbuffered logging
    ENV PYTHONDONTWRITEBYTECODE=1
    ENV PYTHONUNBUFFERED=1
    
    # Install system dependencies (e.g. gcc)
    RUN apt-get update && \
        apt-get install -y --no-install-recommends gcc
    
    # Upgrade pip and copy the application source code
    RUN pip install --upgrade pip
    COPY . /usr/src/app/.
    
    # Install Python dependencies and build wheels
    COPY ./requirements.txt .
    RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt
    
    
    # -----------------------------------------
    # STAGE 2: Final Image
    # -----------------------------------------
    FROM python:3.10-slim-buster
    
    # Create a directory for the app user
    RUN mkdir -p /home/app
    
    # Create the app user and group
    RUN addgroup --system app && adduser --system --group app
    
    # Set environment variables and create application directories
    ENV HOME=/home/app
    ENV APP_HOME=/home/app/web
    RUN mkdir -p $APP_HOME
    RUN mkdir -p $APP_HOME/staticfiles
    WORKDIR $APP_HOME
    
    # Install runtime dependencies (e.g. netcat) and Python packages from wheels built earlier
    RUN apt-get update && apt-get install -y --no-install-recommends netcat
    COPY --from=builder /usr/src/app/wheels /wheels
    COPY --from=builder /usr/src/app/requirements.txt .
    RUN pip install --upgrade pip
    RUN pip install --no-cache /wheels/*
    
    # Copy the entrypoint script. This script is responsible for running migrations,
    # creating the test user "pi", collecting static files, and finally starting Gunicorn.
    COPY ./entrypoint.sh .
    RUN sed -i 's/\r$//g' $APP_HOME/entrypoint.sh
    RUN chmod +x $APP_HOME/entrypoint.sh
    
    # Copy the rest of the project files
    COPY . $APP_HOME
    
    # Ensure the app user owns all files
    RUN chown -R app:app $APP_HOME
    
    # Switch to the app user
    USER app
    
    # Set the entrypoint to run the entrypoint.sh script
    ENTRYPOINT ["/home/app/web/entrypoint.sh"]
    
    # Default command to run the Gunicorn server
    CMD exec gunicorn app.wsgi:application --bind 0.0.0.0:${USERDATA_PORT} --access-logfile -
    