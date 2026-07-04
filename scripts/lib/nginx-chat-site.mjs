/**
 * Install chat.bybelt.com nginx config (Shopify :3005 + Next.js :3004).
 */
export function installChatNginxSite(vps, confSrc, sshFn) {
  const confAvail = "/etc/nginx/sites-available/chat.bybelt.com.conf";
  const confEnabled = "/etc/nginx/sites-enabled/chat.bybelt.com";

  sshFn(
    vps,
    [
      `sudo cp ${confSrc} ${confAvail}`,
      `sudo ln -sf ${confAvail} ${confEnabled}`,
      "sudo rm -f /etc/nginx/sites-enabled/shopifychat.bybelt.com",
      "sudo rm -f /etc/nginx/sites-available/shopifychat.bybelt.com.conf",
      "sudo nginx -t",
      "sudo systemctl reload nginx",
    ].join(" && "),
  );
}
