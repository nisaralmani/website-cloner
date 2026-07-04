import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ url: string; dest: string }[]} */
const ASSETS = [
  {
    url: "https://app.crisp.chat/images/components/initiate/InitiateLoginFeature/triggers.png",
    dest: "public/images/login/triggers.png",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/1747cdaf85d3fc00/bot_gezgje.svg",
    dest: "public/images/plugins/bot.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/3a46d28460b81200/icon_bufkhk.svg",
    dest: "public/images/plugins/messenger.svg",
  },
  {
    url: "https://storage.crisp.chat/plugins/images/0a2069f1-87cf-45d5-bb63-95601cce9267/icon.svg",
    dest: "public/images/plugins/triggers.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/924f9f73e3e49800/icon_1x6lwgw.svg",
    dest: "public/images/plugins/salesforce.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/5462044f4940f800/icon_9qq0o1.svg",
    dest: "public/images/plugins/pipedrive.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/23872d0c66ec260/icon_e3ipxb.svg",
    dest: "public/images/plugins/zapier.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/e0d4609cb37ad800/icon_1udpd0w.svg",
    dest: "public/images/plugins/segment.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/38b411d9377a6a00/autoresponder_1dxxpao.svg",
    dest: "public/images/plugins/auto-responder.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/abc9b60141b50800/icon_14yj9au.svg",
    dest: "public/images/plugins/twitter-dm.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/8b6770c6c93b6000/icon_f3e8hm.svg",
    dest: "public/images/plugins/telegram.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/2009e012a6010c00/icon_ykh2r7.svg",
    dest: "public/images/plugins/slack.svg",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/-/a/a/3/2/aa32423e7e2c3000/jira-boss-logo-edited_khiv5x.png",
    dest: "public/images/plugins/jira-boss-ai.png",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/-/8/9/5/a/895a886e07435000/kokoniai-ebay-thumbnail_2umc72.png",
    dest: "public/images/plugins/ebay-messages.png",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/-/5/0/3/1/5031a570b6ad0400/icon-dark_1noz7sj.png",
    dest: "public/images/plugins/hugo.png",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/-/9/1/2/0/91204b65a7b0b800/icon_s1e0cl.png",
    dest: "public/images/plugins/chat-rate-pro.png",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/-/5/7/b/c/57bcd1a5e33d9000/group-2_50k8bj.png",
    dest: "public/images/plugins/discord-tickets.png",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/-/c/9/7/5/c97514df287d6000/sqgrasshopper-logo-symbolr-blu_1u2yw1t.png",
    dest: "public/images/plugins/request-screen-recording.png",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/-/8/7/e/1/87e10a4797adc00/faviconlogo_1vuove8.png",
    dest: "public/images/plugins/watchdog.png",
  },
  {
    url: "https://storage.crisp.chat/users/marketplace/plugin/-/9/6/8/8/96882a68183a5800/android-chrome-512x512_1dm4pif.png",
    dest: "public/images/plugins/produktly.png",
  },
  {
    url: "https://storage.crisp.chat/users/avatar/operator/161e186c55938100/3e5a6739-6d80-42f6-a402-121dd5_1r6acd.jpg",
    dest: "public/images/avatars/operator-nisar.jpg",
  },
  {
    url: "https://storage.crisp.chat/users/avatar/website/-/3/f/8/c/3f8c6c70432fe400/sisll_c9rlld.jpg",
    dest: "public/images/avatars/workspace-fashionsis.jpg",
  },
  {
    url: "https://storage.crisp.chat/users/avatar/website/-/6/8/9/1/6891ae29795db800/275643465110694081566560848608_9q549i.jpg",
    dest: "public/images/avatars/workspace-fashiondia.jpg",
  },
  {
    url: "https://storage.crisp.chat/users/avatar/website/-/1/f/8/f/1f8f38e194f98b00/fxpx_1p8o03c.jpg",
    dest: "public/images/avatars/workspace-fashionaxe.jpg",
  },
  {
    url: "https://storage.crisp.chat/users/avatar/website/-/6/8/c/a/68caee9de0b07400/velvethem-squre_zbrgnp.jpg",
    dest: "public/images/avatars/workspace-velvethem.jpg",
  },
  {
    url: "https://storage.crisp.chat/public/documents/gdpr_dpa_contract.pdf",
    dest: "public/documents/gdpr_dpa_contract.pdf",
  },
];

const INTEGRATION_ICONS = [
  "chatbox",
  "wordpress",
  "shopify",
  "prestashop",
  "woocommerce",
  "whmcs",
  "adobe_commerce",
  "chatbox_embedded",
  "gmail",
  "outlook",
  "email",
  "instagram",
  "messenger",
  "slack",
  "telegram",
  "twitter",
  "whatsapp",
  "aircall",
  "auto_responder",
  "bot",
  "contact_form",
  "discord",
  "github",
  "hugo",
  "klaviyo",
  "line",
  "ringover",
  "ticket_center",
  "triggers",
  "twilio",
  "viber",
  "ios",
  "android",
  "react",
];

for (const name of INTEGRATION_ICONS) {
  ASSETS.push({
    url: `https://app.crisp.chat/images/popups/ChatboxIntegrations/${name}.svg`,
    dest: `public/images/integrations/${name}.svg`,
  });
}

async function download(url, dest) {
  const filePath = path.join(root, dest);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${response.status} ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return buffer.length;
}

let ok = 0;
let failed = 0;
for (const asset of ASSETS) {
  try {
    const bytes = await download(asset.url, asset.dest);
    console.log(`OK ${asset.dest} (${bytes} bytes)`);
    ok += 1;
  } catch (error) {
    failed += 1;
    console.warn(`SKIP ${asset.dest}: ${error instanceof Error ? error.message : error}`);
  }
}

console.log(`Downloaded ${ok}/${ASSETS.length} assets (${failed} skipped).`);
