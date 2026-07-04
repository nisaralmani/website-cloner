export function webhookLoader() {
  return new Response("Method Not Allowed", { status: 405 });
}
