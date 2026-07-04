import type { Contact } from "@/types/contacts";

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function contactsToCsv(contacts: Contact[]): string {
  const header = "Name,Email,Location,Company,Segments,Last Active,Score";
  const rows = contacts.map((contact) =>
    [
      contact.name,
      contact.email,
      contact.location,
      contact.company,
      contact.segments.join(";"),
      contact.lastActive,
      String(contact.score),
    ]
      .map(escapeCsvField)
      .join(","),
  );
  return [header, ...rows].join("\n");
}
