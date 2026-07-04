export const WIDGET_ESCALATE_RE =
  /\b(human|agent|representative|customer service|real person|talk to someone|talk to a human|live agent|speak to (a|someone)|operator)\b/i;

export const WIDGET_GREETING_RE =
  /^\s*(hi+|he+y+|hello+|hiya|heya|yo|hola|howdy|sup|greetings|good\s*(morning|afternoon|evening)|gm|gn)[\s!.,]*$/i;

export const WIDGET_ORDER_NUMBER_RE = /#?(\d{4,})/;

export function extractOrderNumber(text: string): string | null {
  const match = text.match(WIDGET_ORDER_NUMBER_RE);
  return match?.[1] ?? null;
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}
