"use client";

import { useState, useCallback } from 'react';
import { llmChat, type LlmChatInput, type LlmChatOutput } from '@/ai/flows/llm-chat-feature';
import type { Message } from '@/components/chat/message-list';
import { LLM_MODELS, type LlmModelValue } from '@/config/forex';
import { useToast } from '@/hooks/use-toast';

export function useLlmChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<LlmModelValue>(LLM_MODELS[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addMessage = (text: string, sender: 'user' | 'bot', model?: string) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: Date.now().toString(), text, sender, model },
    ]);
  };

  const handleSendMessage = useCallback(async (userMessage: string) => {
    addMessage(userMessage, 'user');
    setIsLoading(true);

    const modelLabel = LLM_MODELS.find(m => m.value === selectedModel)?.label || selectedModel;

    try {
      const input: LlmChatInput = {
        modelName: selectedModel, // This is illustrative; the actual flow might use a specific model or this parameter
        message: userMessage,
      };
      const output: LlmChatOutput = await llmChat(input);
      addMessage(output.response, 'bot', modelLabel);
    } catch (error) {
      console.error('Error sending message to LLM:', error);
      addMessage('Sorry, I encountered an error. Please try again.', 'bot', modelLabel);
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: 'Could not get a response from the AI. Please check your connection or try a different model.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel, toast]);

  return {
    messages,
    selectedModel,
    setSelectedModel,
    isLoading,
    handleSendMessage,
  };
}
