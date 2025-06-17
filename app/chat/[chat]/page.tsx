'use client';

import { useState } from 'react';
import { Send, Code, Play, Minimize2, Maximize2 } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import CodePreview from '@/components/chat/CodePreview';
import Sidebar from '@/components/chat/Sidebar';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean}>>([]);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), content: input, isUser: true }]);
    setInput('');

    if(!isExpanded) {
      setIsExpanded(true);
    }

    console.log('Sending message:', input);

    try {
      const aiResponse = "Sure here is the code:";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content: aiResponse, isUser: false }]);
      
      const response = await axios.post('/api/chat', {
        prompt: input
      });
      
      const fullResponse = response.data.message;
      
      const codeBlockRegex = /```[\s\S]*?```/g;
      const codeMatches = fullResponse.match(codeBlockRegex);
      const textPart = fullResponse.replace(codeBlockRegex, '').trim();
      
      if (textPart && textPart !== aiResponse) {
        setMessages(prev => prev.map(msg => 
          msg.content === aiResponse && !msg.isUser 
            ? { ...msg, content: textPart }
            : msg
        ));
      }
      
      if (codeMatches && codeMatches.length > 0) {
        setCode(codeMatches[0]);
      }
      
    } catch (error) {
      console.error('Error in chat API:', error);
      const simpleCode = `\`\`\`javascript
const greeting = "Hello World!";
console.log(greeting);
alert("Code is working!");
\`\`\``;
      setCode(simpleCode);
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  console.log(`current user id: ${session?.user?.id}`);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className={`transition-layout duration-500 ease-in-out ${
        isExpanded ? 'grid grid-cols-5 h-screen' : 'flex items-center justify-center min-h-screen'
      }`}>
        <Sidebar title="Chats" session={session} />
        
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
                <h1 className="text-4xl font-bold bg-gradient-to-b from-zinc-300 via-zinc-600 to-zinc-800 bg-clip-text text-transparent">
                  Bolt
                </h1>
              </div>
              {!isExpanded && (
                <p className="bg-gradient-to-b from-zinc-400 via-zinc-500 to-zinc-700 bg-clip-text text-transparent text-lg">
                  Enter a prompt to get started
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
            <div className={`transition-all duration-500 flex-shrink-0 ${
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
                  autoFocus={isExpanded}
                  disabled={false}
                  readOnly={false}
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
          <div className="col-span-3 bg-black">
            <CodePreview code={code} />
          </div>
        )}
      </div>
    </div>
  );
}