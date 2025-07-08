import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn(
      "flex gap-3 p-4 rounded-lg transition-smooth",
      isUser ? "ml-auto max-w-[80%] bg-chat-user-bg text-chat-user-fg" : "mr-auto max-w-[85%] bg-chat-assistant-bg text-chat-assistant-fg"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary/20" : "bg-secondary/40"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <div className={cn(
          "text-sm font-medium",
          isUser ? "text-chat-user-fg" : "text-chat-assistant-fg"
        )}>
          {isUser ? "You" : "Assistant"}
        </div>
        
        <div className={cn(
          "prose prose-sm max-w-none",
          isUser ? "text-chat-user-fg" : "text-chat-assistant-fg"
        )}>
          <p className="whitespace-pre-wrap leading-relaxed">
            {content}
            {isStreaming && (
              <span className="animate-pulse">▌</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}