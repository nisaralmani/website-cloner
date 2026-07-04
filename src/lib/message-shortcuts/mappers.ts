import type { messageShortcuts } from "@/db/schema";
import type { MessageShortcut, MessageShortcutGroup } from "@/types/message-shortcuts";

type MessageShortcutRow = typeof messageShortcuts.$inferSelect;

export function toMessageShortcut(row: MessageShortcutRow): MessageShortcut {
  return {
    id: row.id,
    bang: row.bang,
    tag: row.tag,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

export function groupMessageShortcuts(shortcuts: MessageShortcut[]): MessageShortcutGroup[] {
  const groups = new Map<string, MessageShortcut[]>();

  for (const shortcut of shortcuts) {
    const tag = shortcut.tag?.trim() || "Untagged";
    const existing = groups.get(tag) ?? [];
    existing.push(shortcut);
    groups.set(tag, existing);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([tag, items]) => ({
      tag,
      shortcuts: items.sort((left, right) => left.bang.localeCompare(right.bang)),
    }));
}

export function shortcutsByBang(shortcuts: MessageShortcut[]) {
  return Object.fromEntries(shortcuts.map((shortcut) => [shortcut.bang, shortcut.message]));
}
