import { ForexDashboard } from "@/components/forex/forex-dashboard";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LlmChatClient } from "@/components/chat/llm-chat-client";
import { MessageCircle, Bot } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Bot className="mr-2 h-5 w-5" /> AI Chat
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  AI Chat Assistant
                </SheetTitle>
              </SheetHeader>
              <LlmChatClient />
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="flex-1">
        <ForexDashboard />
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t bg-secondary/50">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ForexSage. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Disclaimer: Forex trading involves substantial risk of loss and is not suitable for all investors.
          </p>
        </div>
      </footer>
    </div>
  );
}
