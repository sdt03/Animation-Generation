"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, MoreHorizontal } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "llm";
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface LeftSidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (id: string) => void;
  onNewChat: () => void;
}

export const LeftSidebar = ({ 
  conversations, 
  currentConversationId, 
  onConversationSelect, 
  onNewChat 
}: LeftSidebarProps) => {
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleNewChat = async () => {
    setIsCreatingChat(true);
    try {
      await onNewChat();
    } catch (error) {
      console.error("Error creating new chat:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const cleanTitle = (title: string) => {
    // Remove ** from start and end, then truncate
    let cleanedTitle = title.replace(/^\*\*|\*\*$/g, '').trim();
    if (cleanedTitle.length > 40) {
      cleanedTitle = cleanedTitle.substring(0, 40) + "...";
    }
    return cleanedTitle;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-700 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700">
        <Button
          variant="secondary"
          onClick={handleNewChat}
          disabled={isCreatingChat}
          className="w-40 ml-20 text-black cursor-pointer hover:bg-zinc-800 hover:text-white transition-all duration-300 border border-zinc-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreatingChat ? "Creating..." : "New Chat"}
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div key={conversation.id}>
                <Button
                  variant="ghost"
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentConversationId === conversation.id
                      ? "bg-zinc-700 text-white"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <h3 className="font-medium text-sm truncate">
                      {cleanTitle(conversation.title || "Untitled Chat")}
                    </h3>
                    <MoreHorizontal className="w-4 h-4 opacity-50 flex-shrink-0 ml-2" />
                  </div>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-700">
        <div className="text-xs text-zinc-500 text-center">
          Animation Generator
        </div>
      </div>
    </div>
  );
};