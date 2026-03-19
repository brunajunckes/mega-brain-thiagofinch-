FROM nginx:alpine

# Copy site files
COPY brand.aioxsquad.ai/ /usr/share/nginx/html/

# Copy nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
