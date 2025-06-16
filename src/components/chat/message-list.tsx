"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  model?: string;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <ScrollArea className="flex-grow h-[calc(100vh-250px)] md:h-[calc(100vh-280px)] p-4 rounded-md border bg-muted/20">
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-3 max-w-[85%]",
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <Avatar className="border">
              <AvatarImage src={msg.sender === "user" ? "/user-avatar.png" : "/bot-avatar.png"} />
              <AvatarFallback>
                {msg.sender === "user" ? <User /> : <Bot />}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "p-3 rounded-lg shadow-sm",
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground"
              )}
            >
              {msg.sender === "bot" && msg.model && (
                <p className="text-xs font-medium text-muted-foreground mb-1">{msg.model}</p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
         {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                <Bot size={48} className="mx-auto mb-2" />
                <p>No messages yet. Start a conversation!</p>
            </div>
        )}
      </div>
    </ScrollArea>
  );
}
