import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const OLLAMA_MODEL = "qwen3:14b";
const OLLAMA_API_URL = "http://localhost:11434/api/chat";

export function OllamaChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentResponse("");
  };

  const sendMessage = async (userMessage: string) => {
    setError(null);
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsStreaming(true);
    setCurrentResponse("");

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const allMessages = [...messages, newUserMessage];
      
      const response = await fetch(OLLAMA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: allMessages,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let fullResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
              setCurrentResponse(fullResponse);
            }
            
            if (data.done) {
              setMessages(prev => [...prev, { role: "assistant", content: fullResponse }]);
              setCurrentResponse("");
              setIsStreaming(false);
              return;
            }
          } catch (parseError) {
            console.warn("Failed to parse chunk:", line);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Request cancelled",
          description: "The request was stopped by the user.",
        });
      } else {
        let errorMessage = "An unexpected error occurred";
        
        if (error.message?.includes("fetch")) {
          errorMessage = "Could not connect to Ollama. Please ensure Ollama is running on http://localhost:11434";
        } else if (error.message?.includes("404")) {
          errorMessage = `Model '${OLLAMA_MODEL}' not found. Please ensure the model is pulled using: ollama pull ${OLLAMA_MODEL}`;
        } else {
          errorMessage = error.message || errorMessage;
        }
        
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      setIsStreaming(false);
      setCurrentResponse("");
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setCurrentResponse("");
    if (isStreaming) {
      stopStreaming();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col bg-gradient-chat">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ollama Chatbot</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                Model: {OLLAMA_MODEL}
              </Badge>
              {isStreaming && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  Streaming...
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <Button
          onClick={clearChat}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isStreaming}
        >
          <RefreshCw className="w-4 h-4" />
          Clear Chat
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">Welcome to Ollama Chat</h3>
              <p className="text-muted-foreground">
                Start a conversation with the {OLLAMA_MODEL} model. Ask me anything!
              </p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
          
          {isStreaming && currentResponse && (
            <ChatMessage
              role="assistant"
              content={currentResponse}
              isStreaming={true}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isStreaming}
        isStreaming={isStreaming}
        onStopStreaming={stopStreaming}
      />
    </div>
  );
}