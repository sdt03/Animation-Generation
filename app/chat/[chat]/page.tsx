"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/chat/LeftSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { BrowserIDE } from "@/components/chat/BrowserIDE";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";

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

export default function ChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const chatId = params.chat as string;

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load specific conversation when chatId changes
  useEffect(() => {
    if (chatId && conversations.length > 0) {
      loadConversation(chatId);
    }
  }, [chatId, conversations]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get("/api/fetch-conversations");
      
      if (response.status === 200 && response.data.conversations) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        
        // Fetch full message history for the conversation
        const response = await axios.get(`/api/fetch-messages?conversationId=${conversationId}`);
        
        if (response.status === 200 && response.data.messages) {
          let latestCode = "";
          const processedMessages = response.data.messages.map((msg: Message) => {
            if (msg.sender === "llm") {
              // Extract EXPLANATION, CODE, and any trailing explanation
              const explanationMatch = msg.content.match(/EXPLANATION:\s*([\s\S]*?)(?=CODE:|$)/);
              // CODE: up to the next triple backticks and then explanation after that
              const codeMatch = msg.content.match(/CODE:\s*([\s\S]*?```[\s\S]*?```)/);
              let afterCode = "";
              if (codeMatch) {
                // Find anything after the closing triple backticks
                const codeBlock = codeMatch[1];
                const afterCodeIdx = msg.content.indexOf(codeBlock) + codeBlock.length;
                if (afterCodeIdx < msg.content.length) {
                  afterCode = msg.content.slice(afterCodeIdx).trim();
                }
              }
              let explanation = "";
              if (explanationMatch) explanation += explanationMatch[1].trim();
              if (afterCode) {
                explanation += (explanation ? "\n\n" : "") + afterCode;
              }
              // Remove any code blocks from explanation
              explanation = explanation.replace(/```[\s\S]*?```/g, "");
              if (codeMatch) {
                latestCode = codeMatch[1].trim();
              }
              return { ...msg, content: explanation.trim() };
            }
            return msg;
          });
          setMessages(processedMessages);
          setGeneratedCode(latestCode);
        } else {
          setMessages([]);
          setGeneratedCode("");
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      setMessages([]);
      setGeneratedCode("");
    }
  };

  const createNewChat = async () => {
    try {
      const response = await axios.post("/api/new-chat");

      if (response.status === 200) {
        router.push(`/chat/${response.data.conversationId}`);
        fetchConversations(); // Refresh the conversations list
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const sendMessage = async (content: string) => {
    let conversationId = currentConversation?.id;
    
    if (!conversationId) {
      // If no current conversation, create a new one first
      try {
        const response = await axios.post("/api/new-chat");
        
        if (response.status === 200) {
          conversationId = response.data.conversationId;
          router.push(`/chat/${conversationId}`);
        } else {
          console.error("Failed to create new chat");
          return;
        }
      } catch (error) {
        console.error("Error creating new chat:", error);
        return;
      }
    }

    setIsLoading(true);
    
    // Add user message immediately to UI
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender: "user",
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await axios.post("/api/send-message", {
          conversationId: conversationId,
          prompt: content,
      });

      if (response.status === 200) {
        // Parse the AI response to separate explanation and code
        const fullResponse = response.data.message;
        let explanation = "";
        let code = "";
        const explanationMatch = fullResponse.match(/EXPLANATION:\s*([\s\S]*?)(?=CODE:|$)/);
        const codeMatch = fullResponse.match(/CODE:\s*([\s\S]*?```[\s\S]*?```)/);
        let afterCode = "";
        if (codeMatch) {
          const codeBlock = codeMatch[1];
          const afterCodeIdx = fullResponse.indexOf(codeBlock) + codeBlock.length;
          if (afterCodeIdx < fullResponse.length) {
            afterCode = fullResponse.slice(afterCodeIdx).trim();
          }
        }
        if (explanationMatch) explanation += explanationMatch[1].trim();
        if (afterCode) {
          explanation += (explanation ? "\n\n" : "") + afterCode;
        }
        // Remove any code blocks from explanation
        explanation = explanation.replace(/```[\s\S]*?```/g, "");
        if (codeMatch) {
          code = codeMatch[1].trim();
          setGeneratedCode(code);
        }
        // Add AI response to messages (only explanation part)
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: explanation.trim() || "Here's your code!",
          sender: "llm",
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen bg-zinc-900 text-white">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 bg-zinc-800 hover:bg-zinc-700"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Overlay Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <LeftSidebar
          conversations={conversations}
          currentConversationId={chatId}
          onConversationSelect={(id) => router.push(`/chat/${id}`)}
          onNewChat={createNewChat}
        />
      </div>

      {/* Main Content Area - Full Width */}
      <div className="flex h-full">
        {/* Chat Interface */}
        <div className={`${messages.length === 0 && !isLoading ? 'w-full' : 'w-1/2'} ${messages.length > 0 || isLoading ? 'border-r border-zinc-700' : ''} transition-all duration-300 ease-in-out`}>
          <ChatInterface
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            conversationTitle={currentConversation?.title || "New Chat"}
          />
        </div>

        {/* Browser IDE - Only show when there are messages or loading */}
        {(messages.length > 0 || isLoading) && (
          <div className="w-1/2 animate-in slide-in-from-right duration-300">
            <BrowserIDE
              code={generatedCode}
              onCodeChange={setGeneratedCode}
            />
          </div>
        )}
      </div>
    </div>
  );
}