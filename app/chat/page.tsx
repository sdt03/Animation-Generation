"use client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  return (
    <div>
      <h1>Chat</h1>
      <p>{session.user?.name}</p>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  );
}