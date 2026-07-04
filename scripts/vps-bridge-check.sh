#!/bin/bash
SECRET=$(grep '^BYBELT_INTERNAL_SECRET=' /var/www/bybelt/chat/.env.production | cut -d= -f2-)
echo "=== from chat container to shopify plugin ==="
docker exec bybelt-chat node -e "
fetch('http://bybelt-shopify-chat:3000/plugin/shopify/internal/health', {
  headers: { 'X-Bybelt-Internal-Secret': process.env.BYBELT_INTERNAL_SECRET }
}).then(r => r.text()).then(console.log).catch(e => console.error(e.message));
"
