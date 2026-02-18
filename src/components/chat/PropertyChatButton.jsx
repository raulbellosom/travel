import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../contexts/ChatContext";
import { cn } from "../../utils/cn";
import { Spinner } from "../common";

/**
 * "Start Chat" button displayed on the property detail page.
 * Only visible to authenticated, email-verified users with role "client".
 * Internal roles (owner/staff/root) cannot initiate conversations from here.
 *
 * @param {{ resourceId?: string, resourceTitle?: string, propertyId?: string, propertyTitle?: string, ownerUserId: string, ownerName: string, className?: string }} props
 */
const PropertyChatButton = ({
  resourceId,
  resourceTitle,
  propertyId,
  propertyTitle,
  ownerUserId,
  ownerName,
  className,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { startConversation, isAuthenticated } = useChat();
  const [loading, setLoading] = useState(false);

  const isClient = user?.role === "client";
  const isVerified = Boolean(user?.emailVerified);
  const canChat = isAuthenticated && isClient && isVerified;

  const handleClick = async () => {
    if (!canChat) return;

    // Don't let the owner chat with themselves
    if (user?.$id === ownerUserId) return;

    setLoading(true);
    try {
      await startConversation({
        resourceId: resourceId || propertyId,
        resourceTitle: resourceTitle || propertyTitle,
        propertyId,
        propertyTitle,
        ownerUserId,
        ownerName,
      });
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show for the property owner / internal roles
  if (user?.$id === ownerUserId) return null;

  /* ── Not authenticated: show login CTA ─────────────── */
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className={cn(
          "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
          "border-2 border-slate-300 text-slate-500",
          "hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800/30",
          className,
        )}
      >
        <MessageCircle size={16} />
        {t("chat.propertyButton.loginToChat")}
      </Link>
    );
  }

  /* ── Authenticated but not client role ──────────────── */
  if (!isClient) {
    return null; // Internal roles don't initiate from the public page
  }

  /* ── Client but email not verified ─────────────────── */
  if (!isVerified) {
    return (
      <div
        className={cn(
          "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium",
          "border-2 border-amber-300 bg-amber-50 text-amber-700",
          "dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
          className,
        )}
      >
        <ShieldCheck size={16} />
        {t("chat.propertyButton.verifyRequired")}
      </div>
    );
  }

  /* ── Verified client: show chat button ──────────────── */
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
        "border-2 border-cyan-600 text-cyan-700",
        "hover:bg-cyan-50 dark:border-cyan-500 dark:text-cyan-400 dark:hover:bg-cyan-950/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {loading ? <Spinner size="xs" /> : <MessageCircle size={16} />}
      {t("chat.propertyButton.startChat")}
    </button>
  );
};

export default PropertyChatButton;
