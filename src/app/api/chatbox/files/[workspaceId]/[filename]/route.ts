import { readFileSync } from "node:fs";
import path from "node:path";
import { chatboxUploadDirectory } from "@/lib/chatbox/message-attachment";

type RouteContext = { params: Promise<{ workspaceId: string; filename: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { workspaceId, filename } = await context.params;

  if (!/^[\w-]+$/.test(workspaceId) || !/^[\w.-]+$/.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(chatboxUploadDirectory(workspaceId), filename);

  try {
    const buffer = readFileSync(filePath);
    const extension = path.extname(filename).slice(1).toLowerCase();
    const mime =
      extension === "jpg" || extension === "jpeg"
        ? "image/jpeg"
        : extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : extension === "gif"
              ? "image/gif"
              : extension === "pdf"
                ? "application/pdf"
                : extension === "txt"
                  ? "text/plain"
                  : "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
