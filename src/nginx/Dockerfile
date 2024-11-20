FROM nginx

COPY ./static /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY ./config /etc/nginx/conf.d/
