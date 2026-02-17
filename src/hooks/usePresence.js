import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { databases } from "../api/appwriteClient";
import env from "../env";

/**
 * Hook to manage user presence (online status) via heartbeat
 * Updates lastSeenAt every 30 seconds while user is authenticated
 */
export const usePresence = () => {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    console.log(
      "[usePresence] Effect triggered - isAuthenticated:",
      isAuthenticated,
      "user:",
      user?.$id,
    );

    if (!isAuthenticated || !user?.$id) {
      console.log(
        "[usePresence] Not authenticated or no user ID, clearing interval",
      );
      // Clear interval if user logs out
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      userIdRef.current = null;
      return;
    }

    // Store user ID
    userIdRef.current = user.$id;

    // Function to update presence
    const updatePresence = async () => {
      const userId = userIdRef.current;
      if (!userId) {
        console.warn("[usePresence] No userId in ref, skipping update");
        return;
      }

      try {
        console.log(
          "[usePresence] Attempting to update presence for user:",
          userId,
        );
        console.log("[usePresence] Database:", env.appwrite.databaseId);
        console.log(
          "[usePresence] Collection:",
          env.appwrite.collections.users,
        );

        await databases.updateDocument(
          env.appwrite.databaseId,
          env.appwrite.collections.users,
          userId,
          {
            lastSeenAt: new Date().toISOString(),
          },
        );
        console.log("[usePresence] ✅ Updated presence for user:", userId);
      } catch (error) {
        console.error("[usePresence] ❌ Failed to update presence:", error);
        console.error("[usePresence] Error details:", {
          message: error.message,
          code: error.code,
          type: error.type,
        });
      }
    };

    // Update presence immediately on mount
    console.log("[usePresence] Setting up heartbeat for user:", user.$id);
    updatePresence();

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up interval to update every 30 seconds
    intervalRef.current = setInterval(() => {
      console.log("[usePresence] Heartbeat tick");
      updatePresence();
    }, 30000); // 30 seconds

    // Cleanup on unmount or user change
    return () => {
      console.log("[usePresence] Cleaning up interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, user?.$id]);

  return null; // This hook doesn't return anything, just runs side effects
};
