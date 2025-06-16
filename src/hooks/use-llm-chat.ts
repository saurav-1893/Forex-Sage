"use client";

import { useState, useCallback, useEffect } from 'react';
import { llmChat, type LlmChatInput, type LlmChatOutput } from '@/ai/flows/llm-chat-feature';
import type { Message } from '@/components/chat/message-list';
import { LLM_MODELS, type LlmModelValue } from '@/config/forex';
import { useToast } from '@/hooks/use-toast';
import { smartGenerate } from '@/services/ai-service';

const CHAT_MESSAGES_STORAGE_KEY = 'forexSageChatMessages';

export function useLlmChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<LlmModelValue>(LLM_MODELS[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Failed to load messages from localStorage:", error);
      // Optionally, clear corrupted storage
      // localStorage.removeItem(CHAT_MESSAGES_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save messages to localStorage:", error);
    }
  }, [messages]);

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
      // Use our new AI service instead of direct LLM calls
      const output = await smartGenerate(userMessage);
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