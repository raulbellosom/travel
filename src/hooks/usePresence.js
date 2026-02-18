import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { databases } from "../api/appwriteClient";
import env from "../env";

/**
 * Hook to manage user presence (online status) via heartbeat.
 * Updates lastSeenAt every 30 seconds while user is authenticated.
 */
export const usePresence = () => {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.$id) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updatePresence = async () => {
      if (isUpdatingRef.current) return;

      isUpdatingRef.current = true;
      try {
        await databases.updateDocument({
          databaseId: env.appwrite.databaseId,
          collectionId: env.appwrite.collections.users,
          documentId: user.$id,
          data: {
            lastSeenAt: new Date().toISOString(),
          },
        });
      } catch {
        // Presence is best-effort; avoid noisy logs every heartbeat.
      } finally {
        isUpdatingRef.current = false;
      }
    };

    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        updatePresence();
      }
    };

    updatePresence();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updatePresence, 30000);

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", updatePresence);
    window.addEventListener("online", updatePresence);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", updatePresence);
      window.removeEventListener("online", updatePresence);
    };
  }, [isAuthenticated, user?.$id]);

  return null;
};
