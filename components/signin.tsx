"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export default function SignIn() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button onClick={() => signIn("google", { callbackUrl: "/chat" })}>Sign In with Google</Button>
    </div>
  );
}