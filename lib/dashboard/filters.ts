type ConversationSearchRecord = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  property: { name: string } | null;
};

export type ConversationView = "all" | "needs_reply";

export function filterConversationRecords<T extends ConversationSearchRecord>(
  inquiries: readonly T[],
  query: string,
  view: ConversationView,
) {
  const normalized = query.trim().toLowerCase();
  return inquiries.filter((inquiry) => {
    const searchable = `${inquiry.full_name} ${inquiry.email ?? ""} ${inquiry.phone ?? ""} ${inquiry.property?.name ?? ""}`.toLowerCase();
    const matchesQuery = !normalized || searchable.includes(normalized);
    const matchesView = view === "all" || inquiry.status === "new";
    return matchesQuery && matchesView;
  });
}

export function selectVisibleConversation<T extends { id: string }>(
  visible: readonly T[],
  selectedId: string,
) {
  return visible.find((inquiry) => inquiry.id === selectedId) ?? visible[0] ?? null;
}
