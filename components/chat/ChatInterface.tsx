"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Loader2, ArrowUp } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "llm";
  createdAt: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  conversationTitle: string;
}

export const ChatInterface = ({
  messages,
  onSendMessage,
  isLoading,
  conversationTitle,
}: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
      <div className="flex flex-col h-full bg-zinc-900">
      {messages.length === 0 ? (
        /* Empty state - centered everything */
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="text-center text-zinc-500 mb-8">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-10 h-10 opacity-50" />
            </div>
            <h3 className="text-2xl font-medium mb-4">Start a conversation</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed">
              Send a message to get started with animation generation and code explanations
            </p>
          </div>
          
          {/* Centered Input */}
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What animation would you like to create?"
                  className="min-h-[60px] max-h-32 resize-none bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400 focus:border-blue-500 rounded-xl px-4 py-4 pr-12 w-full"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 bottom-2 h-8 w-8 bg-white hover:bg-gray-200 rounded-full cursor-pointer text-black"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
            
            <div className="mt-3 text-xs text-zinc-500 text-center">
              Describe your animation idea and I'll help you create it
            </div>
          </div>
        </div>
              ) : (
        /* Messages list - scrollable */
        <>
          <div className="flex-1 overflow-hidden">
            <div 
              className="h-full overflow-y-auto px-4 py-6 custom-scrollbar"
              style={{
                scrollbarWidth: 'auto',
                scrollbarColor: '#3f3f46 #18181b'
              }}
            >
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div key={message.id} className="w-full">
                    {message.sender === "user" ? (
                      <div className="flex items-start justify-end space-x-3 mb-6">
                        <div className="max-w-[80%]">
                          <div className="bg-zinc-800 text-white rounded-2xl rounded-tr-md px-4 py-3">
                            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {message.content}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500 mt-2 text-right">
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full mb-6">
                        <div className="text-white px-6 py-4">
                          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {message.content}
                          </div>
                          <div className="text-xs text-zinc-500 mt-3">
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="w-full mb-6">
                    <div className="bg-zinc-800 rounded-2xl px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400 flex-shrink-0" />
                        <span className="text-zinc-400 text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Fixed Input Area at Bottom for Messages View */}
          <div className="flex-shrink-0 p-4 border-t border-zinc-700 bg-zinc-900">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about animations and code..."
                    className="min-h-[48px] max-h-32 resize-none bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400 focus:border-blue-500 rounded-xl px-4 py-3"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isLoading}
                  className="h-10 w-10 bg-white rounded-xl rounded-full cursor-pointer text-black"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </Button>
              </form>
              
              <div className="mt-3 text-xs text-zinc-500 text-center">
                Ask for explanations, guidance, or animation concepts
              </div>
            </div>
          </div>
        </>
        )}
      </div>
    </>
  );
}; 