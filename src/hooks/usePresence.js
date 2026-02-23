import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { databases } from "../api/appwriteClient";
import env from "../env";

/** How often to send the heartbeat (ms). Must be < ONLINE_WINDOW_SECONDS in presence.js. */
const HEARTBEAT_INTERVAL_MS = 15_000; // 15 s

/**
 * After this many ms of inactivity, the next user-activity event will
 * immediately re-send a heartbeat (so a tab that just became active is
 * seen as online right away without waiting for the next interval tick).
 */
const ACTIVITY_IDLE_THRESHOLD_MS = 20_000; // 20 s

/**
 * Hook to manage user presence (online status) via heartbeat.
 * Sends lastSeenAt updates while the user has the tab open and active.
 * - Regular interval (15 s)
 * - Immediate update on visibility change → visible, window focus, online event
 * - Immediate update on first user interaction after being idle for >20 s
 */
export const usePresence = () => {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

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
      // Don't send if tab is hidden — saves quota and avoids misleading timestamps.
      if (document.visibilityState !== "visible") return;

      isUpdatingRef.current = true;
      lastActivityRef.current = Date.now();
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

    /** Fires on any user interaction; sends a heartbeat only if idle too long. */
    const handleActivity = () => {
      if (Date.now() - lastActivityRef.current >= ACTIVITY_IDLE_THRESHOLD_MS) {
        updatePresence();
      }
    };

    // Fire immediately on mount.
    updatePresence();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", updatePresence);
    window.addEventListener("online", updatePresence);

    // Activity listeners — throttled by ACTIVITY_IDLE_THRESHOLD_MS logic above.
    const ACTIVITY_EVENTS = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "pointerdown",
    ];
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true }),
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", updatePresence);
      window.removeEventListener("online", updatePresence);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity),
      );
    };
  }, [isAuthenticated, user?.$id]);

  return null;
};
