'use client';

import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatInterface({ messages, isLoading }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-slate-400 mt-12">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Start a conversation to see your chat history</p>
        </div>
      )}
      
      {messages.map((message) => (
        <div
          key={message.id}
          className={`animate-fade-in-up flex gap-3 ${
            message.isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            message.isUser 
              ? 'bg-blue-600' 
              : 'bg-slate-700'
          }`}>
            {message.isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
          
          <div className={`chat-message rounded-2xl px-4 py-3 ${
            message.isUser
              ? 'bg-blue-600 text-white ml-12'
              : 'bg-slate-700 text-slate-100 mr-12'
          }`}>
            <p className="leading-relaxed">{message.content}</p>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="animate-fade-in-up flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-slate-700 text-slate-100 rounded-2xl px-4 py-3 mr-12">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}