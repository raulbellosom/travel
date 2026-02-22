import { useEffect, useMemo, useState } from "react";
import { client } from "../api/appwriteClient";
import env from "../env";
import { profileService } from "../services/profileService";

const PROFILE_POLL_INTERVAL_MS = 30000;
const PRESENCE_TICK_INTERVAL_MS = 15000;

const normalizeId = (value) => String(value || "").trim();

/**
 * Presence helper for chat UIs.
 * - Fetches profile data for user ids (avatar + lastSeenAt).
 * - Listens to Appwrite Realtime updates on users collection.
 * - Keeps a lightweight timer so "last seen" text updates while time passes.
 */
export const useChatPresence = (userIds = []) => {
  const userIdsSignature = useMemo(
    () =>
      Array.from(
        new Set(
          (userIds || [])
            .map((userId) => normalizeId(userId))
            .filter(Boolean),
        ),
      ).join("|"),
    [userIds],
  );

  const normalizedUserIds = useMemo(
    () => (userIdsSignature ? userIdsSignature.split("|") : []),
    [userIdsSignature],
  );

  const [profilesById, setProfilesById] = useState({});
  const [, setPresenceTick] = useState(() => Date.now());

  // Keep only cached profiles that are still watched.
  useEffect(() => {
    setProfilesById((prev) => {
      if (normalizedUserIds.length === 0) return {};
      const next = {};
      normalizedUserIds.forEach((id) => {
        if (prev[id]) next[id] = prev[id];
      });
      return next;
    });
  }, [normalizedUserIds, userIdsSignature]);

  // Initial load + polling fallback.
  useEffect(() => {
    if (normalizedUserIds.length === 0) return undefined;

    let cancelled = false;

    const fetchProfiles = async () => {
      const results = await Promise.allSettled(
        normalizedUserIds.map(async (id) => ({
          id,
          profile: await profileService.getProfile(id),
        })),
      );

      if (cancelled) return;

      setProfilesById((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value?.profile) {
            next[result.value.id] = result.value.profile;
          }
        });
        return next;
      });
    };

    void fetchProfiles();
    const intervalId = setInterval(fetchProfiles, PROFILE_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [normalizedUserIds, userIdsSignature]);

  // Realtime updates for watched profiles.
  useEffect(() => {
    if (normalizedUserIds.length === 0) return undefined;

    const watchedIds = new Set(normalizedUserIds);
    const databaseId = env.appwrite.databaseId;
    const usersCollectionId = env.appwrite.collections.users;

    if (!databaseId || !usersCollectionId) return undefined;

    let unsubscribe = () => {};

    try {
      const channel = `databases.${databaseId}.collections.${usersCollectionId}.documents`;
      unsubscribe = client.subscribe(channel, (response) => {
        const payload = response?.payload;
        const profileId = normalizeId(payload?.$id);
        if (!profileId || !watchedIds.has(profileId)) return;

        const event = String(response?.events?.[0] || "");
        if (event.includes(".delete")) {
          setProfilesById((prev) => {
            if (!prev[profileId]) return prev;
            const next = { ...prev };
            delete next[profileId];
            return next;
          });
          return;
        }

        setProfilesById((prev) => ({
          ...prev,
          [profileId]: {
            ...(prev[profileId] || {}),
            ...payload,
          },
        }));
      });
    } catch {
      unsubscribe = () => {};
    }

    return () => {
      unsubscribe();
    };
  }, [normalizedUserIds, userIdsSignature]);

  // Force rerender so presence text can age naturally (e.g. "2m ago" -> "3m ago").
  useEffect(() => {
    if (normalizedUserIds.length === 0) return undefined;

    const intervalId = setInterval(() => {
      setPresenceTick(Date.now());
    }, PRESENCE_TICK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [normalizedUserIds, userIdsSignature]);

  return {
    profilesById,
  };
};
