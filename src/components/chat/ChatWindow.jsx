import { AnimatePresence, m } from "framer-motion";
import { useChat } from "../../contexts/ChatContext";
import ConversationList from "./ConversationList";
import ConversationView from "./ConversationView";

/**
 * Main chat window that toggles between conversation list and active chat.
 * Full-screen on mobile, card on desktop.
 */
const ChatWindow = () => {
  const { activeConversationId } = useChat();

  const slideVariants = {
    initial: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: "tween", duration: 0.25, ease: "easeOut" },
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: { type: "tween", duration: 0.2, ease: "easeIn" },
    }),
  };

  // direction: 1 = sliding in from right (entering conversation), -1 = sliding in from left (back to list)
  const direction = activeConversationId ? 1 : -1;

  return (
    <div className="flex h-full flex-col overflow-hidden overscroll-contain bg-white sm:rounded-2xl dark:bg-slate-900">
      <AnimatePresence mode="wait" custom={direction}>
        {activeConversationId ? (
          <m.div
            key="conversation-view"
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full"
          >
            <ConversationView />
          </m.div>
        ) : (
          <m.div
            key="conversation-list"
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full"
          >
            <ConversationList />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWindow;
