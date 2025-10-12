import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const LiveChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { conversation, messages, loading, initConversation, sendMessage } = useLiveChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleOpen = async () => {
    setIsOpen(true);
    if (!user && !conversation) {
      setShowGuestForm(true);
    } else if (user && !conversation) {
      await initConversation();
    }
  };

  const handleGuestStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) return;
    await initConversation(guestName, guestEmail);
    setShowGuestForm(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversation?.id) return;
    await sendMessage(messageText, conversation.id);
    setMessageText('');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 w-96 bg-background border rounded-lg shadow-2xl z-50 transition-all duration-300",
        isMinimized ? "h-14" : "h-[32rem]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">Live Chat</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Guest Form */}
          {showGuestForm && (
            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Start a conversation</h3>
                <p className="text-sm text-muted-foreground">We'll get back to you instantly</p>
              </div>
              <form onSubmit={handleGuestStart} className="space-y-3">
                <Input
                  placeholder="Your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  Start Chat
                </Button>
              </form>
            </div>
          )}

          {/* Messages */}
          {!showGuestForm && conversation && (
            <>
              <ScrollArea className="h-[22rem] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_type === 'agent' ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                          msg.sender_type === 'agent'
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!messageText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
};
