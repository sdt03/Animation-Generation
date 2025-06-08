import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Textbox } from "@/components/chat/textbox";
import Sidebar from "@/components/chat/Sidebar";
import Chatwindow from "@/components/chat/Chatwindow";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  return (
    <div className="relative bg-black h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar title="Chats" session={session}/>
      
      {/* Main content area */}
      <div className="flex w-full h-full top-10 ml-40 ">
        <Chatwindow />
      </div>
    </div>
  );
}