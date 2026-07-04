import { APP_WIDGET_PATH } from "@/lib/marketing-paths";

export function getChatboxEmbedLoaderScript(): string {
  return `(function () {
  var config = window.BYBELT_CHAT;
  if (!config || !config.websiteId) return;
  if (document.getElementById("bybelt-chatbox-root")) return;

  var script = document.currentScript;
  var origin = script && script.src ? new URL(script.src, window.location.href).origin : window.location.origin;

  var params = new URLSearchParams();
  params.set("embed", "1");
  params.set("workspaceId", config.websiteId);
  if (config.domain) params.set("domain", config.domain);
  if (config.customerEmail) params.set("email", config.customerEmail);
  if (config.customerName) params.set("name", config.customerName);

  var open = false;
  var root = document.createElement("div");
  root.id = "bybelt-chatbox-root";
  root.style.cssText =
    "position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;";

  var panel = document.createElement("div");
  panel.style.cssText = "display:none;margin-bottom:12px;";

  var iframe = document.createElement("iframe");
  iframe.src = origin + "${APP_WIDGET_PATH}?" + params.toString();
  iframe.title = "Chat support";
  iframe.allow = "microphone; camera";
  iframe.style.cssText =
    "width:376px;height:520px;max-width:calc(100vw - 32px);max-height:calc(100vh - 100px);border:none;border-radius:16px;box-shadow:0 20px 60px rgba(25,37,59,0.18);background:#fff;";

  var bubble = document.createElement("button");
  bubble.type = "button";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.setAttribute("aria-expanded", "false");
  bubble.style.cssText =
    "display:flex;align-items:center;justify-content:center;width:56px;height:56px;border:none;border-radius:9999px;background:#1972F5;color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(25,114,245,0.35);";

  bubble.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';

  function setOpen(next) {
    open = next;
    panel.style.display = open ? "block" : "none";
    bubble.style.display = open ? "none" : "flex";
    bubble.setAttribute("aria-expanded", open ? "true" : "false");
  }

  bubble.addEventListener("click", function () {
    setOpen(true);
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    if (event.data && event.data.type === "bybelt-chatbox-close") {
      setOpen(false);
    }
  });

  panel.appendChild(iframe);
  root.appendChild(panel);
  root.appendChild(bubble);
  document.body.appendChild(root);
})();`;
}
