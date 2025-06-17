"use client";
import { useEffect, useState } from "react";
import { SidebarClose, SidebarOpen, Plus, SquarePen } from "lucide-react";
import { Session } from "next-auth";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  title: string | null;
}

interface SidebarProps {
  title: string;
  session?: Session | null;
}

export default function Sidebar({ title, session }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      if (session?.user) {
        try {
          setLoading(true);
          const response = await fetch('/api/fetch-conversations');
          const data = await response.json();
          setConversations(data.conversations || []);
        } catch (error) {
          console.error('Error fetching conversations:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchConversations();
  }, [session]);

  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/new-chat', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 z-10">
      {/* Sidebar */}
      <div 
        className={`
          bg-black text-white w-80 h-full shadow-lg border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <SidebarClose 
              size={24} 
              onClick={() => setIsOpen(false)} 
              className="cursor-pointer hover:text-gray-400 transition-colors duration-200"
            />
          </div>
          
          <Button
            variant="secondary"
            className="w-full py-2 mb-6 text-black rounded-md flex items-center justify-center gap-2 transition-colors duration-200"
            onClick={handleNewChat}
          >
            <Plus size={18} />
            <span>New Chat</span>
          </Button>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length > 0 ? (
            <nav className="mt-2">
              <ul className="space-y-2">
                {conversations.map((conversation) => (
                  <li 
                    key={conversation.id}
                    className="p-2 hover:bg-gray-800 rounded cursor-pointer transition-colors duration-200 truncate"
                  >
                    {conversation.title || "Untitled Conversation"}
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <div className="text-center py-6 text-gray-400">
              No Chats yet
            </div>
          )}
        </div>
      </div>
      
      {/* Toggle buttons with tooltips */}
      <div 
        className={`
          absolute top-4 left-4 flex gap-2
          transition-opacity duration-300
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        {/* Menu button with tooltip */}
        <div className="group relative">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center p-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <SidebarOpen size={24} />
          </button>
          <div className="absolute left-0 top-full mt-2 w-max px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Open Sidebar
          </div>
        </div>
        
        {/* New note button with tooltip */}
        <div className="group relative">
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center p-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <SquarePen size={24} />
          </button>
          <div className="absolute left-0 top-full mt-2 w-max px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            New Chat
          </div>
        </div>
      </div>
    </div>
  );
}