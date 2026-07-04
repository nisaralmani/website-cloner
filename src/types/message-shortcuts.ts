export type MessageShortcut = {
  id: string;
  bang: string;
  tag: string | null;
  message: string;
  createdAt: string;
};

export type MessageShortcutGroup = {
  tag: string;
  shortcuts: MessageShortcut[];
};
