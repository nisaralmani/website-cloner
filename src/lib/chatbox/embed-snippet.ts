export type ChatboxEmbedSnippet = {

  websiteId: string;

  domain: string;

  scriptUrl: string;

  widgetUrl: string;

  htmlSnippet: string;

};



import { APP_EMBED_SCRIPT_PATH, APP_WIDGET_PATH } from "@/lib/marketing-paths";



function resolveEmbedOrigin(requestOrigin: string): string {

  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  return configured || requestOrigin;

}



export function buildChatboxEmbedSnippet(

  requestOrigin: string,

  workspace: { id: string; domain: string },

): ChatboxEmbedSnippet {

  const origin = resolveEmbedOrigin(requestOrigin);

  const websiteId = workspace.id;

  const domain = workspace.domain;

  const scriptUrl = `${origin}${APP_EMBED_SCRIPT_PATH}`;

  const widgetParams = new URLSearchParams({

    embed: "1",

    workspaceId: websiteId,

    domain,

  });

  const widgetUrl = `${origin}${APP_WIDGET_PATH}?${widgetParams.toString()}`;



  const htmlSnippet = `<script>

  window.BYBELT_CHAT = { websiteId: "${websiteId}", domain: "${domain}" };

</script>

<script src="${scriptUrl}" async defer></script>`;



  return {

    websiteId,

    domain,

    scriptUrl,

    widgetUrl,

    htmlSnippet,

  };

}

