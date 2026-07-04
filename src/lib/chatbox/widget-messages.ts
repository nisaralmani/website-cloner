export function isWidgetVisibleMessage(from: string): boolean {
  return from === "visitor" || from === "operator";
}

export function filterWidgetMessages<T extends { from: string }>(messages: T[]): T[] {
  return messages.filter((message) => isWidgetVisibleMessage(message.from));
}
