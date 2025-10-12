import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Paperclip, Smile, Image as ImageIcon, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';

export const LiveChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    conversation, 
    messages, 
    loading, 
    isTyping,
    agentStatus,
    initConversation, 
    sendMessage,
    uploadFile,
    setTypingIndicator,
    addReaction,
  } = useLiveChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Calculate unread count from agent messages when chat is closed
    if (!isOpen && messages.length > 0) {
      const agentMessages = messages.filter(m => m.sender_type === 'agent' && !m.is_read);
      setUnreadCount(agentMessages.length);
    } else if (isOpen) {
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

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
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation?.id) return;
    
    setUploadingFile(true);
    const attachment = await uploadFile(file, conversation.id);
    if (attachment) {
      await sendMessage(messageText || '', conversation.id, attachment);
      setMessageText('');
    }
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file || !conversation?.id) return;
    
    setUploadingFile(true);
    const attachment = await uploadFile(file, conversation.id);
    if (attachment) {
      await sendMessage('', conversation.id, attachment);
    }
    setUploadingFile(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (conversation?.id) {
      setTypingIndicator(conversation.id, e.target.value.length > 0);
    }
  };

  const renderFilePreview = (msg: any) => {
    const { attachment_url, attachment_name, attachment_type } = msg.metadata || {};
    if (!attachment_url) return null;

    const isImage = attachment_type?.startsWith('image/');
    
    return (
      <div className="mt-2 rounded-lg overflow-hidden bg-muted/50 border">
        {isImage ? (
          <img src={attachment_url} alt={attachment_name} className="max-w-[200px] max-h-[200px] object-cover" />
        ) : (
          <a 
            href={attachment_url} 
            download={attachment_name}
            className="flex items-center gap-2 p-3 hover:bg-muted transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm truncate flex-1">{attachment_name}</span>
            <Download className="h-4 w-4" />
          </a>
        )}
      </div>
    );
  };

  const renderReactions = (msg: any) => {
    const reactions = msg.metadata?.reactions || {};
    if (Object.keys(reactions).length === 0) return null;

    return (
      <div className="flex gap-1 mt-1 flex-wrap">
        {Object.entries(reactions).map(([emoji, users]: [string, any]) => (
          users.length > 0 && (
            <button
              key={emoji}
              onClick={() => addReaction(msg.id, emoji)}
              className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            >
              {emoji} {users.length}
            </button>
          )
        ))}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 animate-pulse hover:animate-none z-50"
        size="icon"
      >
        <MessageCircle className="h-7 w-7" />
        {agentStatus === 'online' && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-ping" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-background animate-bounce">
            {unreadCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 w-[400px] bg-background/95 backdrop-blur-xl border rounded-2xl shadow-2xl z-50 transition-all duration-500 ease-out",
        isMinimized ? "h-16" : "h-[600px]",
        isDragging && "ring-4 ring-primary/50"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {agentStatus === 'online' && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-background" />
            )}
          </div>
          <div>
            <span className="font-semibold">Live Support</span>
            <p className="text-xs opacity-90">
              {agentStatus === 'online' ? 'Online now' : 'We\'ll reply soon'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
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
            <div className="p-6 space-y-4 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Start a conversation</h3>
                <p className="text-sm text-muted-foreground">Connect with us instantly</p>
              </div>
              <form onSubmit={handleGuestStart} className="space-y-3">
                <Input
                  placeholder="Your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="border-2 focus:ring-2 focus:ring-primary"
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  className="border-2 focus:ring-2 focus:ring-primary"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Starting...' : 'Start Chat'}
                </Button>
              </form>
            </div>
          )}

          {/* Messages */}
          {!showGuestForm && conversation && (
            <>
              <ScrollArea className="h-[440px] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="animate-fade-in">
                      <div
                        className={cn(
                          "flex",
                          msg.sender_type === 'agent' ? "justify-start" : "justify-end"
                        )}
                      >
                        <div className="group relative max-w-[85%]">
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md",
                              msg.sender_type === 'agent'
                                ? "bg-muted rounded-tl-none"
                                : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tr-none"
                            )}
                          >
                            {msg.message}
                            {renderFilePreview(msg)}
                          </div>
                          {renderReactions(msg)}
                          <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            {['❤️', '👍', '😊', '🎉'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(msg.id, emoji)}
                                className="text-lg hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t bg-background/50">
                {showEmojiPicker && (
                  <div className="absolute bottom-20 right-4 z-50">
                    <EmojiPicker 
                      onEmojiClick={(emoji) => {
                        setMessageText(prev => prev + emoji.emoji);
                        setShowEmojiPicker(false);
                      }}
                    />
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleTyping}
                    className="flex-1 border-2 focus:ring-2 focus:ring-primary"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!messageText.trim() || uploadingFile}
                    className="shrink-0 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};