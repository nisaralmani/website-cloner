#!/bin/bash
set -euo pipefail

REMOTE=/var/www/bybelt/chat
PORT=3004

sudo tee /etc/nginx/sites-available/bybelt > /dev/null <<'NGINX'
server {
    listen 443 ssl;
    server_name bybelt.com;
    ssl_certificate /etc/letsencrypt/live/bybelt.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bybelt.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    return 301 https://www.bybelt.com$request_uri;
}

server {
    listen 443 ssl;
    server_name app.bybelt.com;
    ssl_certificate /etc/letsencrypt/live/bybelt.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bybelt.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name bybelt.com www.bybelt.com;
    return 301 https://www.bybelt.com$request_uri;
}

server {
    listen 80;
    server_name app.bybelt.com;
    return 301 https://app.bybelt.com$request_uri;
}
NGINX

setup_site() {
  local domain=$1
  local conf=$2
  local cert_name=$3
  shift 3
  local cert_domains=("$@")
  local avail="/etc/nginx/sites-available/${domain}.conf"
  local enabled="/etc/nginx/sites-enabled/${domain}"
  local cert_dir="/etc/letsencrypt/live/${cert_name}"

  sudo cp "${REMOTE}/deploy/nginx/${conf}" "${avail}"

  if [ ! -d "${cert_dir}" ]; then
    local names="${cert_domains[*]}"
    sudo tee "/etc/nginx/sites-available/${domain}-bootstrap.conf" > /dev/null <<BOOT
server {
    listen 80;
    server_name ${names};
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
BOOT
    sudo ln -sf "/etc/nginx/sites-available/${domain}-bootstrap.conf" "${enabled}"
    sudo nginx -t && sudo systemctl reload nginx
    local cert_args=()
    for d in "${cert_domains[@]}"; do cert_args+=(-d "$d"); done
    sudo certbot certonly --nginx "${cert_args[@]}" --non-interactive --agree-tos -m contact@fashionpara.com || true
    sudo rm -f "${enabled}"
    sudo rm -f "/etc/nginx/sites-available/${domain}-bootstrap.conf"
  fi

  sudo cp "${REMOTE}/deploy/nginx/${conf}" "${avail}"
  sudo ln -sf "${avail}" "${enabled}"
}

setup_site www.bybelt.com www.bybelt.com.conf bybelt.com www.bybelt.com bybelt.com
setup_site help.bybelt.com help.bybelt.com.conf help.bybelt.com help.bybelt.com
setup_site docs.bybelt.com docs.bybelt.com.conf docs.bybelt.com docs.bybelt.com

sudo nginx -t && sudo systemctl reload nginx
echo "Nginx configured for www, help, and docs."
