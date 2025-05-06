"use client";

import { ModelSelector } from "./model-selector";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { useLlmChat } from "@/hooks/use-llm-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LlmChatClient() {
  const {
    messages,
    selectedModel,
    setSelectedModel,
    isLoading,
    handleSendMessage,
  } = useLlmChat();

  return (
    <div className="flex flex-col h-full bg-card">
        <div className="p-4 border-b">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isLoading}
          />
        </div>
        <MessageList messages={messages} />
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
