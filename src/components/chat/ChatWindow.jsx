import { useChat } from "../../contexts/ChatContext";
import ConversationList from "./ConversationList";
import ConversationView from "./ConversationView";

/**
 * Main chat window that toggles between conversation list and active chat.
 * Full-screen on mobile, card on desktop.
 */
const ChatWindow = () => {
  const { activeConversationId } = useChat();

  return (
    <div className="flex h-full flex-col overflow-hidden overscroll-contain bg-white sm:rounded-2xl dark:bg-slate-900">
      {activeConversationId ? <ConversationView /> : <ConversationList />}
    </div>
  );
};

export default ChatWindow;
