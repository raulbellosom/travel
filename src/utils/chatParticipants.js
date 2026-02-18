const normalizeId = (value) => String(value || "").trim();

const isKnownSide = (value) => value === "client" || value === "owner";

export const getConversationSide = (conversation, userId, fallbackRole) => {
  const normalizedUserId = normalizeId(userId);
  const clientUserId = normalizeId(conversation?.clientUserId);
  const ownerUserId = normalizeId(conversation?.ownerUserId);

  if (normalizedUserId && clientUserId === normalizedUserId) return "client";
  if (normalizedUserId && ownerUserId === normalizedUserId) return "owner";
  if (isKnownSide(fallbackRole)) return fallbackRole;
  return null;
};

export const getConversationCounterparty = (conversation, userId, fallbackRole) => {
  const side = getConversationSide(conversation, userId, fallbackRole);
  if (side === "client") {
    return {
      userId: normalizeId(conversation?.ownerUserId),
      name: String(conversation?.ownerName || "").trim(),
      side: "owner",
    };
  }
  if (side === "owner") {
    return {
      userId: normalizeId(conversation?.clientUserId),
      name: String(conversation?.clientName || "").trim(),
      side: "client",
    };
  }
  return { userId: "", name: "", side: null };
};

export const getConversationUnreadCount = (conversation, userId, fallbackRole) => {
  const side = getConversationSide(conversation, userId, fallbackRole);
  if (side === "client") return Number(conversation?.clientUnread || 0);
  if (side === "owner") return Number(conversation?.ownerUnread || 0);
  return 0;
};

export const getConversationUnreadResetPatch = (conversation, userId, fallbackRole) => {
  const side = getConversationSide(conversation, userId, fallbackRole);
  if (side === "client") return { clientUnread: 0 };
  if (side === "owner") return { ownerUnread: 0 };
  return {};
};
