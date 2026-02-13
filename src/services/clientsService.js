import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";

const BATCH_SIZE = 100;
const MAX_SCAN = 1000;

const normalizeSearch = (value) => String(value || "").trim().toLowerCase();

const bySearch = (items, search) => {
  const query = normalizeSearch(search);
  if (!query) return items;

  return items.filter((item) => {
    const firstName = String(item.firstName || "").toLowerCase();
    const lastName = String(item.lastName || "").toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const email = String(item.email || "").toLowerCase();
    const phone = String(item.phone || "").toLowerCase();
    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      fullName.includes(query) ||
      email.includes(query) ||
      phone.includes(query)
    );
  });
};

const byDateRange = (items, fromDate, toDate) => {
  const from = fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : null;
  const to = toDate ? new Date(`${toDate}T23:59:59.999Z`) : null;

  return items.filter((item) => {
    const createdAt = new Date(item.$createdAt);
    if (Number.isNaN(createdAt.getTime())) return false;
    if (from && createdAt < from) return false;
    if (to && createdAt > to) return false;
    return true;
  });
};

const paginate = (items, page, limit) => {
  if (limit === "all") {
    return {
      documents: items,
      page: 1,
      limit: "all",
      total: items.length,
      totalPages: 1,
    };
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;
  return {
    documents: items.slice(offset, offset + safeLimit),
    page: safePage,
    limit: safeLimit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
  };
};

export const clientsService = {
  async listClients({
    enabled = "all",
    search = "",
    createdFrom = "",
    createdTo = "",
    page = 1,
    limit = 20,
  } = {}) {
    ensureAppwriteConfigured();

    const baseQueries = [
      Query.equal("role", "client"),
      Query.orderDesc("$createdAt"),
    ];

    if (enabled === "enabled") {
      baseQueries.push(Query.equal("enabled", true));
    } else if (enabled === "disabled") {
      baseQueries.push(Query.equal("enabled", false));
    }

    const scanned = [];
    let offset = 0;
    let truncated = false;

    while (scanned.length < MAX_SCAN) {
      const response = await databases.listDocuments({
        databaseId: env.appwrite.databaseId,
        collectionId: env.appwrite.collections.users,
        queries: [
          ...baseQueries,
          Query.limit(BATCH_SIZE),
          Query.offset(offset),
        ],
      });

      const batch = response.documents || [];
      scanned.push(...batch);

      if (batch.length < BATCH_SIZE) {
        break;
      }

      offset += batch.length;
      if (scanned.length >= MAX_SCAN) {
        truncated = true;
      }
    }

    const sliced = scanned.slice(0, MAX_SCAN);
    const filteredBySearch = bySearch(sliced, search);
    const filteredByDate = byDateRange(filteredBySearch, createdFrom, createdTo);
    const paginated = paginate(filteredByDate, page, limit);

    return {
      ...paginated,
      truncated,
      scanned: sliced.length,
    };
  },
};
