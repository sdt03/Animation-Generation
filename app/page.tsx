import ChatInterface from "@/components/chat/ChatInterface";

export default function Home() {
  return (
    <div>
      <ChatInterface messages={[]} isLoading={false} /> 
    </div>
  );
}