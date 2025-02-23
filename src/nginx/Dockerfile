FROM nginx

RUN rm -f /etc/nginx/conf.d/*

# Create necessary directories
RUN mkdir -p /usr/share/nginx/html/static/images \
    && mkdir -p /usr/share/nginx/html/static/js \
    && mkdir -p /usr/share/nginx/html/static/css

# Copy configuration
COPY ./config /etc/nginx/conf.d/

# Copy static files individually to ensure they exist
COPY ./static/index.html /usr/share/nginx/html/static/
COPY ./static/js/*.js /usr/share/nginx/html/static/js/
COPY ./static/css/*.css /usr/share/nginx/html/static/css/
COPY ./static/images/42_logo.png /usr/share/nginx/html/static/images/

# Set permissions
RUN chmod -R 755 /usr/share/nginx/html/static

# Debug: List contents to verify
RUN ls -la /usr/share/nginx/html/static/images/
