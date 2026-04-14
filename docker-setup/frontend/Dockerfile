FROM nginx:alpine

# Copy nginx config
COPY ../front_end /usr/share/nginx/html

# Copy frontend files to nginx html directory
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy custom nginx configuration
# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
