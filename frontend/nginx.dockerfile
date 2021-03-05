FROM nginx:1.18
EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
