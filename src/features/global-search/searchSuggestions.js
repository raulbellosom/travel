import { INTERNAL_ROUTES, getInternalEditPropertyRoute } from "../../utils/internalRoutes";

const MAX_RESULTS = 14;
const MAX_ENTITY_RESULTS = 4;

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toShortId = (value) => String(value || "").slice(0, 8);

const matchScore = (query, values) => {
  if (!query) return 1;

  const normalizedValues = values.map((value) => normalizeText(value));
  let score = 0;

  for (const value of normalizedValues) {
    if (!value) continue;
    if (value === query) score = Math.max(score, 120);
    else if (value.startsWith(query)) score = Math.max(score, 90);
    else if (value.includes(query)) score = Math.max(score, 70);
  }

  return score;
};

const toIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toActionItems = ({
  t,
  canReadProperties,
  canReadLeads,
  canReadReservations,
  canReadPayments,
  canWriteProperties,
  canManageTeam,
  canSeeSettings,
}) => {
  const items = [
    {
      id: "action-dashboard",
      group: "actions",
      title: t("globalSearch.quickActions.dashboard.title"),
      subtitle: t("globalSearch.quickActions.dashboard.subtitle"),
      icon: "layout-dashboard",
      action: { type: "navigate", to: INTERNAL_ROUTES.dashboard },
      keywords: ["dashboard", "overview", "resumen", "inicio", "panel"],
    },
    {
      id: "action-profile",
      group: "actions",
      title: t("globalSearch.quickActions.profile.title"),
      subtitle: t("globalSearch.quickActions.profile.subtitle"),
      icon: "user",
      action: { type: "navigate", to: INTERNAL_ROUTES.profile },
      keywords: ["profile", "perfil", "mi perfil", "account", "cuenta"],
    },
  ];

  if (canReadProperties) {
    items.push({
      id: "action-properties",
      group: "actions",
      title: t("globalSearch.quickActions.properties.title"),
      subtitle: t("globalSearch.quickActions.properties.subtitle"),
      icon: "building",
      action: { type: "navigate", to: INTERNAL_ROUTES.myProperties },
      keywords: ["properties", "property", "propiedades", "propiedad", "listings", "portafolio"],
    });
  }

  if (canReadLeads) {
    items.push({
      id: "action-leads",
      group: "actions",
      title: t("globalSearch.quickActions.leads.title"),
      subtitle: t("globalSearch.quickActions.leads.subtitle"),
      icon: "inbox",
      action: { type: "navigate", to: INTERNAL_ROUTES.leads },
      keywords: ["lead", "leads", "inbox", "message", "mensaje", "mensajes", "conversation"],
    });
  }

  if (canReadReservations) {
    items.push({
      id: "action-reservations",
      group: "actions",
      title: t("globalSearch.quickActions.reservations.title"),
      subtitle: t("globalSearch.quickActions.reservations.subtitle"),
      icon: "calendar",
      action: { type: "navigate", to: INTERNAL_ROUTES.reservations },
      keywords: ["reservation", "reservations", "booking", "bookings", "reserva", "reservas", "fecha"],
    });
  }

  if (canReadPayments) {
    items.push({
      id: "action-payments",
      group: "actions",
      title: t("globalSearch.quickActions.payments.title"),
      subtitle: t("globalSearch.quickActions.payments.subtitle"),
      icon: "credit-card",
      action: { type: "navigate", to: INTERNAL_ROUTES.payments },
      keywords: ["payment", "payments", "pago", "pagos", "invoice", "cobro"],
    });
  }

  if (canWriteProperties) {
    items.push({
      id: "action-new-property",
      group: "actions",
      title: t("globalSearch.quickActions.newProperty.title"),
      subtitle: t("globalSearch.quickActions.newProperty.subtitle"),
      icon: "plus-square",
      action: { type: "navigate", to: INTERNAL_ROUTES.createProperty },
      keywords: ["new property", "nueva propiedad", "crear propiedad", "create property", "nuevo listing"],
    });
  }

  if (canManageTeam) {
    items.push({
      id: "action-team",
      group: "actions",
      title: t("globalSearch.quickActions.team.title"),
      subtitle: t("globalSearch.quickActions.team.subtitle"),
      icon: "users",
      action: { type: "navigate", to: INTERNAL_ROUTES.team },
      keywords: ["team", "equipo", "staff", "usuarios"],
    });
  }

  if (canSeeSettings) {
    items.push({
      id: "action-settings",
      group: "actions",
      title: t("globalSearch.quickActions.settings.title"),
      subtitle: t("globalSearch.quickActions.settings.subtitle"),
      icon: "settings",
      action: { type: "navigate", to: INTERNAL_ROUTES.settings },
      keywords: ["settings", "configuracion", "preferences"],
    });
  }

  return items;
};

const getResultGroups = (t) =>
  Object.freeze({
    actions: t("globalSearch.groups.actions"),
    properties: t("globalSearch.groups.properties"),
    leads: t("globalSearch.groups.leads"),
    reservations: t("globalSearch.groups.reservations"),
    payments: t("globalSearch.groups.payments"),
  });

const pickTopMatches = (items) => {
  return [...items]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((item) => {
      const next = { ...item };
      delete next.score;
      return next;
    });
};

export const buildGlobalSearchResults = ({
  t,
  query,
  dataset,
  canReadProperties = false,
  canReadLeads = false,
  canReadReservations = false,
  canReadPayments = false,
  canWriteProperties = false,
  canManageTeam = false,
  canSeeSettings = false,
}) => {
  const normalizedQuery = normalizeText(query);
  const hasQuery = Boolean(normalizedQuery);
  const groups = getResultGroups(t);

  const actions = toActionItems({
    t,
    canReadProperties,
    canReadLeads,
    canReadReservations,
    canReadPayments,
    canWriteProperties,
    canManageTeam,
    canSeeSettings,
  }).map((item) => ({
    ...item,
    groupLabel: groups.actions,
    score: hasQuery ? matchScore(normalizedQuery, item.keywords) : 120,
  }));

  const properties = (dataset?.properties || [])
    .map((property) => {
      const values = [property.title, property.slug, property.city, property.state];
      return {
        id: `property-${property.$id}`,
        group: "properties",
        groupLabel: groups.properties,
        title: property.title || t("globalSearch.fallbacks.property"),
        subtitle: [property.city, property.state].filter(Boolean).join(", "),
        icon: "building",
        action: {
          type: "navigate",
          to: canWriteProperties
            ? getInternalEditPropertyRoute(property.$id)
            : INTERNAL_ROUTES.myProperties,
        },
        score: matchScore(normalizedQuery, values),
      };
    })
    .filter((item) => (hasQuery ? item.score > 0 : true))
    .slice(0, MAX_ENTITY_RESULTS);

  const leads = (dataset?.leads || [])
    .flatMap((lead) => {
      const values = [
        lead.name,
        lead.email,
        lead.phone,
        lead.message,
        lead.status,
        toIsoDate(lead.$createdAt),
      ];
      const score = matchScore(normalizedQuery, values);
      if (hasQuery && score <= 0) return [];

      const conversationItem = {
        id: `lead-conversation-${lead.$id}`,
        group: "leads",
        groupLabel: groups.leads,
        title: t("globalSearch.dynamic.openConversation", {
          name: lead.name || t("globalSearch.fallbacks.client"),
        }),
        subtitle: (lead.message || "").slice(0, 90),
        icon: "message-square",
        action: {
          type: "navigate",
          to: `${INTERNAL_ROUTES.leads}?focus=${encodeURIComponent(lead.$id)}`,
        },
        score: score + 3,
      };

      const emailItem = lead.email
        ? {
            id: `lead-email-${lead.$id}`,
            group: "leads",
            groupLabel: groups.leads,
            title: t("globalSearch.dynamic.sendEmail", {
              name: lead.name || t("globalSearch.fallbacks.client"),
            }),
            subtitle: lead.email,
            icon: "mail",
            action: {
              type: "external",
              href: `mailto:${lead.email}`,
            },
            score: score + 1,
          }
        : null;

      return emailItem ? [conversationItem, emailItem] : [conversationItem];
    })
    .slice(0, MAX_ENTITY_RESULTS * 2);

  const reservations = (dataset?.reservations || [])
    .map((reservation) => {
      const values = [
        reservation.$id,
        reservation.guestName,
        reservation.guestEmail,
        reservation.status,
        reservation.paymentStatus,
        toIsoDate(reservation.checkInDate),
        toIsoDate(reservation.checkOutDate),
      ];
      return {
        id: `reservation-${reservation.$id}`,
        group: "reservations",
        groupLabel: groups.reservations,
        title: t("globalSearch.dynamic.openReservation", {
          id: toShortId(reservation.$id),
        }),
        subtitle: [
          reservation.guestName || t("globalSearch.fallbacks.client"),
          toIsoDate(reservation.checkInDate),
          toIsoDate(reservation.checkOutDate),
        ]
          .filter(Boolean)
          .join(" · "),
        icon: "calendar",
        action: {
          type: "navigate",
          to: `${INTERNAL_ROUTES.reservations}?focus=${encodeURIComponent(reservation.$id)}`,
        },
        score: matchScore(normalizedQuery, values),
      };
    })
    .filter((item) => (hasQuery ? item.score > 0 : true))
    .slice(0, MAX_ENTITY_RESULTS);

  const payments = (dataset?.payments || [])
    .map((payment) => {
      const values = [
        payment.$id,
        payment.reservationId,
        payment.provider,
        payment.providerPaymentId,
        payment.status,
        toIsoDate(payment.$createdAt),
      ];
      return {
        id: `payment-${payment.$id}`,
        group: "payments",
        groupLabel: groups.payments,
        title: t("globalSearch.dynamic.openPayment", {
          id: toShortId(payment.$id),
        }),
        subtitle: [payment.provider, payment.status, payment.reservationId].filter(Boolean).join(" · "),
        icon: "credit-card",
        action: {
          type: "navigate",
          to: `${INTERNAL_ROUTES.payments}?focus=${encodeURIComponent(payment.$id)}`,
        },
        score: matchScore(normalizedQuery, values),
      };
    })
    .filter((item) => (hasQuery ? item.score > 0 : true))
    .slice(0, MAX_ENTITY_RESULTS);

  const merged = [...actions, ...properties, ...leads, ...reservations, ...payments];
  return {
    query: normalizedQuery,
    groups,
    results: pickTopMatches(merged),
  };
};
