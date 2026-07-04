import type { MessageAttachment } from "@/types/inbox";

function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

function isAudioMime(mime: string) {
  return mime.startsWith("audio/");
}

export function MessageAttachmentPreview({
  attachment,
  variant = "inbox",
}: {
  attachment: MessageAttachment;
  variant?: "inbox" | "widget";
}) {
  if (isImageMime(attachment.mime)) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className={
            variant === "widget"
              ? "max-h-40 max-w-full rounded-lg object-cover"
              : "max-h-48 max-w-full rounded-lg object-cover"
          }
        />
      </a>
    );
  }

  if (isAudioMime(attachment.mime)) {
    return (
      <audio
        controls
        src={attachment.url}
        className={variant === "widget" ? "max-w-full" : "w-full max-w-sm"}
      >
        <a
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className={
            variant === "widget"
              ? "text-sm text-white underline underline-offset-2"
              : "text-sm font-medium text-[#1972F5] underline underline-offset-2"
          }
        >
          {attachment.name}
        </a>
      </audio>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={
        variant === "widget"
          ? "text-sm text-white underline underline-offset-2"
          : "text-sm font-medium text-[#1972F5] underline underline-offset-2"
      }
    >
      {attachment.name}
    </a>
  );
}
