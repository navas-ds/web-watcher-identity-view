import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
}

export function ChatInput({ onSendMessage, disabled, isStreaming, onStopStreaming }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-chat-input-bg border-t border-border">
      <div className="flex-1 relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={disabled}
          className={cn(
            "min-h-[60px] resize-none bg-secondary border-border text-foreground",
            "focus:ring-2 focus:ring-primary focus:border-transparent",
            "placeholder:text-muted-foreground"
          )}
        />
      </div>
      
      {isStreaming ? (
        <Button
          type="button"
          onClick={onStopStreaming}
          variant="destructive"
          size="icon"
          className="h-[60px] w-[60px] rounded-lg"
        >
          <Square className="w-5 h-5" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className={cn(
            "h-[60px] w-[60px] rounded-lg bg-gradient-primary",
            "hover:opacity-90 transition-smooth",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </Button>
      )}
    </form>
  );
}