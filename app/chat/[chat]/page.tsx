'use client';

import { useState } from 'react';
import { Send, Code, Play, Minimize2, Maximize2 } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import CodePreview from '@/components/chat/CodePreview';
import Sidebar from '@/components/chat/Sidebar';

export default function Home() {
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean}>>([]);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Expand the layout
    if (!isExpanded) {
      setIsExpanded(true);
    }
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'll help you create that! Let me generate the code for you.",
        isUser: false
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className={`transition-layout duration-500 ease-in-out ${
        isExpanded ? 'grid grid-cols-5 h-screen' : 'flex items-center justify-center min-h-screen'
      }`}>
        <Sidebar title="Chats" />
        
        {/* Chat Section */}
        <div className={`transition-layout duration-500 ease-in-out ${
          isExpanded ? 'col-span-2 border-r border-slate-700' : 'w-full max-w-2xl mx-auto px-6'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`transition-all duration-500 ${
              isExpanded ? 'p-6 border-b border-slate-700' : 'mb-8 text-center'
            }`}>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Bolt
                </h1>
              </div>
              {!isExpanded && (
                <p className="text-slate-400 mt-4 text-lg">
                  What would you like to build today?
                </p>
              )}
            </div>

            {/* Chat Messages */}
            {isExpanded && (
              <ChatInterface 
                messages={messages} 
                isLoading={isLoading} 
              />
            )}

            {/* Input Section */}
            <div className={`transition-all duration-500 ${
              isExpanded ? 'p-6 border-t border-slate-700' : ''
            }`}>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isExpanded ? "Ask me anything..." : "Describe what you want to build..."}
                  className="w-full bg-black border border-slate-600 rounded-xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[60px]"
                  rows={isExpanded ? 3 : 4}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 bottom-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Code/Preview Section */}
        {isExpanded && (
          <div className="col-span-3 bg-slate-800">
            <CodePreview />
          </div>
        )}
      </div>
    </div>
  );
}