import { INTERNAL_ROUTES } from "../../utils/internalRoutes";

const MAX_RESULTS = 16;
const MAX_ENTITY_RESULTS = 5;

const COMMAND_VERBS = Object.freeze({
  create: ["crear", "create", "new", "nuevo", "nueva", "add", "agregar"],
  open: ["ver", "view", "open", "abrir", "go", "ir", "show", "mostrar"],
  manage: ["manage", "gestionar", "administrar", "edit", "editar"],
});

const COMMAND_ENTITIES = Object.freeze({
  dashboard: ["dashboard", "inicio", "home", "panel", "resumen"],
  profile: ["profile", "perfil", "cuenta", "account"],
  properties: [
    "property",
    "properties",
    "propiedad",
    "propiedades",
    "listing",
    "listings",
    "anuncio",
    "anuncios",
    "casa",
    "casas",
  ],
  leads: [
    "lead",
    "leads",
    "mensaje",
    "mensajes",
    "message",
    "messages",
    "inbox",
    "cliente",
    "clientes",
  ],
  reservations: ["reservation", "reservations", "booking", "bookings", "reserva", "reservas"],
  payments: ["payment", "payments", "pago", "pagos", "cobro", "cobros"],
  reviews: ["review", "reviews", "resena", "resenas", "rating", "ratings"],
  team: [
    "team",
    "equipo",
    "staff",
    "usuario",
    "usuarios",
    "user",
    "users",
    "member",
    "miembro",
  ],
  clients: ["client", "clients", "customer", "customers", "cliente", "clientes"],
  settings: ["settings", "configuracion", "config", "preferences", "ajustes"],
});

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toTokens = (value) => normalizeText(value).split(/\s+/).filter(Boolean);

const toIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toShortId = (value) => String(value || "").slice(0, 8);

const buildRouteWithParams = (route, params = {}) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const normalizedValue = String(value ?? "").trim();
    if (!normalizedValue) continue;
    searchParams.set(key, normalizedValue);
  }

  const query = searchParams.toString();
  return query ? `${route}?${query}` : route;
};

const getScore = (query, values = []) => {
  if (!query) return 1;

  const normalizedValues = values.map((value) => normalizeText(value)).filter(Boolean);
  if (normalizedValues.length === 0) return 0;

  const queryTokens = toTokens(query);
  if (queryTokens.length === 0) return 0;

  let bestScore = 0;
  for (const value of normalizedValues) {
    let score = 0;

    if (value === query) score += 140;
    else if (value.startsWith(query)) score += 108;
    else if (value.includes(query)) score += 84;

    const tokenMatches = queryTokens.reduce(
      (acc, token) => (value.includes(token) ? acc + 1 : acc),
      0
    );
    if (tokenMatches === 0 && score === 0) continue;

    score += tokenMatches * 18;
    if (tokenMatches === queryTokens.length) score += 24;
    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
};

const detectIntent = (tokens) => {
  if (tokens.some((token) => COMMAND_VERBS.create.includes(token))) return "create";
  if (tokens.some((token) => COMMAND_VERBS.manage.includes(token))) return "manage";
  if (tokens.some((token) => COMMAND_VERBS.open.includes(token))) return "open";
  return "";
};

const detectEntity = (query, tokens) => {
  for (const [entity, aliases] of Object.entries(COMMAND_ENTITIES)) {
    const hasMatch = aliases.some((alias) => query.includes(alias) || tokens.includes(alias));
    if (hasMatch) return entity;
  }
  return "";
};

const getCommandRemainder = (tokens, intent, entity) => {
  const removable = new Set([...(COMMAND_VERBS[intent] || []), ...(COMMAND_ENTITIES[entity] || [])]);
  return tokens.filter((token) => !removable.has(token)).join(" ").trim();
};

const getCommandLabel = (t, intent, entity) => {
  const verbs = {
    create: t("globalSearch.commandVerbs.create"),
    open: t("globalSearch.commandVerbs.open"),
    manage: t("globalSearch.commandVerbs.manage"),
  };
  const entities = {
    dashboard: t("globalSearch.commandEntities.dashboard"),
    profile: t("globalSearch.commandEntities.profile"),
    properties: t("globalSearch.commandEntities.properties"),
    leads: t("globalSearch.commandEntities.leads"),
    reservations: t("globalSearch.commandEntities.reservations"),
    payments: t("globalSearch.commandEntities.payments"),
    reviews: t("globalSearch.commandEntities.reviews", { defaultValue: "resenas" }),
    team: t("globalSearch.commandEntities.team"),
    clients: t("globalSearch.commandEntities.clients"),
    settings: t("globalSearch.commandEntities.settings"),
  };

  return `${verbs[intent] || verbs.open} ${entities[entity] || t("globalSearch.commandEntities.section")}`.trim();
};

const resolveCommandResult = ({
  t,
  query,
  groups,
  canReadProperties,
  canReadLeads,
  canReadReservations,
  canReadPayments,
  canWriteProperties,
  canManageTeam,
  canSeeSettings,
  canReadClients,
  canReadReviews,
  canReadProfile,
}) => {
  if (!query) return null;

  const tokens = toTokens(query);
  if (tokens.length === 0) return null;

  const intent = detectIntent(tokens) || "open";
  const entity = detectEntity(query, tokens);
  if (!entity) return null;

  const remainder = getCommandRemainder(tokens, intent, entity);
  let action = null;
  let icon = "sparkles";

  if (entity === "dashboard") {
    action = { type: "navigate", to: INTERNAL_ROUTES.dashboard };
    icon = "layout-dashboard";
  } else if (entity === "profile") {
    if (canReadProfile) {
      action = { type: "navigate", to: INTERNAL_ROUTES.profile };
    }
    icon = "user";
  } else if (entity === "properties") {
    icon = "building";
    if (intent === "create" && canWriteProperties) {
      action = { type: "navigate", to: INTERNAL_ROUTES.createProperty };
    } else if (canReadProperties) {
      action = {
        type: "navigate",
        to: buildRouteWithParams(INTERNAL_ROUTES.myProperties, { search: remainder }),
      };
    }
  } else if (entity === "leads") {
    icon = "inbox";
    if (canReadLeads) {
      action = {
        type: "navigate",
        to: buildRouteWithParams(INTERNAL_ROUTES.leads, { search: remainder }),
      };
    }
  } else if (entity === "reservations") {
    icon = "calendar";
    if (canReadReservations) {
      action = {
        type: "navigate",
        to: buildRouteWithParams(INTERNAL_ROUTES.reservations, { search: remainder }),
      };
    }
  } else if (entity === "payments") {
    icon = "credit-card";
    if (canReadPayments) {
      action = {
        type: "navigate",
        to: buildRouteWithParams(INTERNAL_ROUTES.payments, { search: remainder }),
      };
    }
  } else if (entity === "reviews") {
    icon = "message-square";
    if (canReadReviews) {
      action = {
        type: "navigate",
        to: buildRouteWithParams(INTERNAL_ROUTES.reviews, { search: remainder }),
      };
    }
  } else if (entity === "team") {
    icon = "users";
    if (canManageTeam) {
      action = {
        type: "navigate",
        to:
          intent === "create" || intent === "manage"
            ? buildRouteWithParams(INTERNAL_ROUTES.team, { tab: "manage", search: remainder })
            : buildRouteWithParams(INTERNAL_ROUTES.team, { tab: "list", search: remainder }),
      };
    }
  } else if (entity === "clients") {
    icon = "users";
    if (canReadClients) {
      action = {
        type: "navigate",
        to: buildRouteWithParams(INTERNAL_ROUTES.clients, { search: remainder }),
      };
    }
  } else if (entity === "settings") {
    icon = "settings";
    if (canSeeSettings) {
      action = { type: "navigate", to: INTERNAL_ROUTES.settings };
    }
  }

  if (!action) return null;

  return {
    id: `command-${intent}-${entity}`,
    group: "actions",
    groupLabel: groups.actions,
    title: getCommandLabel(t, intent, entity),
    subtitle: remainder
      ? t("globalSearch.commandApplyFilter", { query: remainder })
      : t("globalSearch.commandDirectNavigation"),
    icon,
    action,
    badge: t("globalSearch.badges.command"),
    score: 260,
  };
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
  canReadClients,
  canReadReviews,
  canReadProfile,
}) => {
  const items = [
    {
      id: "action-dashboard",
      group: "actions",
      title: t("globalSearch.quickActions.dashboard.title"),
      subtitle: t("globalSearch.quickActions.dashboard.subtitle"),
      icon: "layout-dashboard",
      action: { type: "navigate", to: INTERNAL_ROUTES.dashboard },
      keywords: ["dashboard", "overview", "resumen", "inicio", "panel", "go dashboard", "ir dashboard"],
    },
    ...(canReadProfile
      ? [
          {
            id: "action-profile",
            group: "actions",
            title: t("globalSearch.quickActions.profile.title"),
            subtitle: t("globalSearch.quickActions.profile.subtitle"),
            icon: "user",
            action: { type: "navigate", to: INTERNAL_ROUTES.profile },
            keywords: ["profile", "perfil", "mi perfil", "account", "cuenta", "preferences"],
          },
        ]
      : []),
  ];

  if (canReadProperties) {
    items.push({
      id: "action-properties",
      group: "actions",
      title: t("globalSearch.quickActions.properties.title"),
      subtitle: t("globalSearch.quickActions.properties.subtitle"),
      icon: "building",
      action: { type: "navigate", to: INTERNAL_ROUTES.myProperties },
      keywords: [
        "properties",
        "property",
        "propiedades",
        "propiedad",
        "listings",
        "portafolio",
        "anuncios",
        "ver anuncios",
        "open properties",
      ],
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
      keywords: [
        "lead",
        "leads",
        "inbox",
        "message",
        "messages",
        "mensaje",
        "mensajes",
        "conversation",
        "cliente",
      ],
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
      keywords: [
        "reservation",
        "reservations",
        "booking",
        "bookings",
        "reserva",
        "reservas",
        "fecha",
        "ver reservas",
        "open reservations",
      ],
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
      keywords: [
        "payment",
        "payments",
        "pago",
        "pagos",
        "invoice",
        "cobro",
        "ver pagos",
        "open payments",
      ],
    });
  }

  if (canReadReviews) {
    items.push({
      id: "action-reviews",
      group: "actions",
      title: t("globalSearch.quickActions.reviews.title", { defaultValue: "Ver resenas" }),
      subtitle: t("globalSearch.quickActions.reviews.subtitle", {
        defaultValue: "Moderacion y estado de resenas",
      }),
      icon: "message-square",
      action: { type: "navigate", to: INTERNAL_ROUTES.reviews },
      keywords: [
        "review",
        "reviews",
        "resena",
        "resenas",
        "moderar resenas",
        "ratings",
        "open reviews",
      ],
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
      keywords: [
        "new property",
        "nueva propiedad",
        "crear propiedad",
        "create property",
        "nuevo listing",
        "create listing",
        "crear anuncio",
      ],
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
      keywords: [
        "team",
        "equipo",
        "staff",
        "usuarios",
        "manage team",
        "administrar equipo",
        "ver equipo",
      ],
    });
    items.push({
      id: "action-new-user",
      group: "actions",
      title: t("globalSearch.quickActions.newUser.title"),
      subtitle: t("globalSearch.quickActions.newUser.subtitle"),
      icon: "user-plus",
      action: {
        type: "navigate",
        to: buildRouteWithParams(INTERNAL_ROUTES.team, { tab: "manage" }),
      },
      keywords: [
        "new user",
        "create user",
        "crear usuario",
        "add staff",
        "agregar usuario",
        "nuevo miembro",
      ],
    });
  }

  if (canReadClients) {
    items.push({
      id: "action-clients",
      group: "actions",
      title: t("globalSearch.quickActions.clients.title"),
      subtitle: t("globalSearch.quickActions.clients.subtitle"),
      icon: "users",
      action: { type: "navigate", to: INTERNAL_ROUTES.clients },
      keywords: [
        "clients",
        "client",
        "clientes",
        "customer",
        "customers",
        "ver clientes",
        "open clients",
      ],
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
      keywords: ["settings", "configuracion", "preferences", "ajustes", "config"],
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
    reviews: t("globalSearch.groups.reviews", { defaultValue: "Resenas" }),
    clients: t("globalSearch.groups.clients", { defaultValue: "Clientes" }),
    profile: t("globalSearch.groups.profile", { defaultValue: "Perfil" }),
    team: t("globalSearch.groups.team"),
  });

const pickTopMatches = (items) =>
  [...items]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((item) => {
      const next = { ...item };
      delete next.score;
      return next;
    });

const getTeamDisplayName = (member, fallback = "") => {
  const fullName = `${member?.firstName || ""} ${member?.lastName || ""}`.trim();
  return fullName || fallback;
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
  canReadClients = false,
  canReadReviews = false,
  canReadProfile = false,
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
    canReadClients,
    canReadReviews,
    canReadProfile,
  }).map((item, index) => ({
    ...item,
    groupLabel: groups.actions,
    score: hasQuery ? getScore(normalizedQuery, item.keywords) : 140 - index,
  }));

  const commandResult = hasQuery
    ? resolveCommandResult({
        t,
        query: normalizedQuery,
        groups,
        canReadProperties,
        canReadLeads,
        canReadReservations,
        canReadPayments,
        canWriteProperties,
        canManageTeam,
        canSeeSettings,
        canReadClients,
        canReadReviews,
        canReadProfile,
      })
    : null;

  const properties = (dataset?.properties || [])
    .map((property) => {
      const values = [property.title, property.slug, property.city, property.state, property.description];
      return {
        id: `property-${property.$id}`,
        group: "properties",
        groupLabel: groups.properties,
        title: property.title || t("globalSearch.fallbacks.property"),
        subtitle: [property.city, property.state].filter(Boolean).join(" - "),
        icon: "building",
        action: {
          type: "navigate",
          to: buildRouteWithParams(INTERNAL_ROUTES.myProperties, {
            search: property.title || property.slug || normalizedQuery,
            focus: property.$id,
          }),
        },
        score: getScore(normalizedQuery, values),
      };
    })
    .filter((item) => (hasQuery ? item.score > 0 : true))
    .slice(0, MAX_ENTITY_RESULTS);

  const team = (dataset?.team || [])
    .map((member) => {
      const displayName = getTeamDisplayName(member, member.email || t("globalSearch.fallbacks.member"));
      const values = [displayName, member.email, member.role];
      return {
        id: `team-${member.$id}`,
        group: "team",
        groupLabel: groups.team,
        title: displayName,
        subtitle: [member.email, member.role].filter(Boolean).join(" - "),
        icon: "users",
        action: {
          type: "navigate",
          to: buildRouteWithParams(INTERNAL_ROUTES.team, {
            tab: "list",
            search: displayName,
            focus: member.$id,
          }),
        },
        score: getScore(normalizedQuery, values),
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
      const score = getScore(normalizedQuery, values);
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
          to: buildRouteWithParams(INTERNAL_ROUTES.leads, {
            focus: lead.$id,
            search: lead.name || lead.email || normalizedQuery,
          }),
        },
        score: score + 4,
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
          .join(" - "),
        icon: "calendar",
        action: {
          type: "navigate",
          to: buildRouteWithParams(INTERNAL_ROUTES.reservations, {
            focus: reservation.$id,
            search: reservation.guestName || reservation.$id,
          }),
        },
        score: getScore(normalizedQuery, values),
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
        subtitle: [payment.provider, payment.status, payment.reservationId].filter(Boolean).join(" - "),
        icon: "credit-card",
        action: {
          type: "navigate",
          to: buildRouteWithParams(INTERNAL_ROUTES.payments, {
            focus: payment.$id,
            search: payment.reservationId || payment.$id,
          }),
        },
        score: getScore(normalizedQuery, values),
      };
    })
    .filter((item) => (hasQuery ? item.score > 0 : true))
    .slice(0, MAX_ENTITY_RESULTS);

  const reviews = (dataset?.reviews || [])
    .map((review) => {
      const values = [
        review.$id,
        review.propertyId,
        review.authorName,
        review.title,
        review.comment,
        review.status,
      ];
      return {
        id: `review-${review.$id}`,
        group: "reviews",
        groupLabel: groups.reviews,
        title:
          review.title ||
          t("globalSearch.dynamic.openReview", {
            defaultValue: "Abrir resena #{{id}}",
            id: toShortId(review.$id),
          }),
        subtitle: [review.authorName, review.status, review.propertyId].filter(Boolean).join(" - "),
        icon: "message-square",
        action: {
          type: "navigate",
          to: buildRouteWithParams(INTERNAL_ROUTES.reviews, {
            focus: review.$id,
            search: review.title || review.authorName || review.$id,
            status: review.status,
          }),
        },
        score: getScore(normalizedQuery, values),
      };
    })
    .filter((item) => (hasQuery ? item.score > 0 : true))
    .slice(0, MAX_ENTITY_RESULTS);

  const clients = (dataset?.clients || [])
    .map((client) => {
      const displayName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
      const values = [client.$id, displayName, client.firstName, client.lastName, client.email, client.phone];
      return {
        id: `client-${client.$id}`,
        group: "clients",
        groupLabel: groups.clients,
        title: displayName || t("globalSearch.fallbacks.client"),
        subtitle: [client.email, client.phone].filter(Boolean).join(" - "),
        icon: "users",
        action: {
          type: "navigate",
          to: buildRouteWithParams(INTERNAL_ROUTES.clients, {
            search: displayName || client.email || normalizedQuery,
            focus: client.$id,
          }),
        },
        score: getScore(normalizedQuery, values),
      };
    })
    .filter((item) => (hasQuery ? item.score > 0 : true))
    .slice(0, MAX_ENTITY_RESULTS);

  const profile = dataset?.profile && canReadProfile
    ? (() => {
        const displayName = `${dataset.profile.firstName || ""} ${dataset.profile.lastName || ""}`.trim();
        const values = [
          dataset.profile.firstName,
          dataset.profile.lastName,
          dataset.profile.email,
          dataset.profile.phone,
          dataset.profile.whatsappNumber,
          dataset.profile.role,
        ];
        return {
          id: `profile-${dataset.profile.$id || "me"}`,
          group: "profile",
          groupLabel: groups.profile,
          title: t("globalSearch.dynamic.openProfile", { defaultValue: "Abrir mi perfil" }),
          subtitle: [displayName, dataset.profile.email, dataset.profile.role].filter(Boolean).join(" - "),
          icon: "user",
          action: { type: "navigate", to: INTERNAL_ROUTES.profile },
          score: getScore(normalizedQuery, values),
        };
      })()
    : null;

  const preferences = dataset?.preferences && canReadProfile
    ? (() => {
        const values = [
          dataset.preferences.theme,
          dataset.preferences.locale,
          dataset.preferences.brandFontHeading,
          dataset.preferences.brandFontBody,
        ];
        return {
          id: `preferences-${dataset.preferences.$id || "me"}`,
          group: "profile",
          groupLabel: groups.profile,
          title: t("globalSearch.dynamic.openPreferences", { defaultValue: "Abrir preferencias" }),
          subtitle: [dataset.preferences.theme, dataset.preferences.locale].filter(Boolean).join(" - "),
          icon: "settings",
          action: { type: "navigate", to: INTERNAL_ROUTES.profile },
          score: getScore(normalizedQuery, values),
        };
      })()
    : null;

  const merged = [
    ...(commandResult ? [commandResult] : []),
    ...actions,
    ...team,
    ...properties,
    ...leads,
    ...reservations,
    ...payments,
    ...reviews,
    ...clients,
    ...(profile ? [profile] : []),
    ...(preferences ? [preferences] : []),
  ];

  return {
    query: normalizedQuery,
    groups,
    results: pickTopMatches(merged),
  };
};
