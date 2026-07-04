#!/bin/bash
SECRET=$(grep '^BYBELT_INTERNAL_SECRET=' /var/www/bybelt/chat/.env.production | cut -d= -f2-)
echo "=== health ==="
curl -s -H "X-Bybelt-Internal-Secret: ${SECRET}" http://localhost:3005/plugin/shopify/internal/health
echo ""
echo "=== workspace status ==="
curl -s -H "X-Bybelt-Internal-Secret: ${SECRET}" "http://localhost:3005/plugin/shopify/internal/customer?workspaceId=e3f25f9d-fd3d-440a-93f1-f3ef0c5db653"
echo ""
echo "=== from chat container ==="
docker exec bybelt-chat sh -c "wget -qO- --header='X-Bybelt-Internal-Secret: ${SECRET}' http://host.docker.internal:3005/plugin/shopify/internal/health" 2>/dev/null || echo "(wget failed)"
