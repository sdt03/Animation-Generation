"use client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export const Header = () => {
    const router = useRouter();
  return (
    <div className="flex justify-between items-center p-3 border border-gray-700 rounded-xl bg-black">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold font-serif bg-gradient-to-b from-white via-zinc-300 to-zinc-600 bg-clip-text text-transparent leading-tight">2D Animation Generator</h1>
      </div>
      <div>
        <Button className="text-white bg-black border border-gray-500 hover:border-white cursor-pointer"
        onClick={()=>router.push("/signin")}>Sign In</Button>
      </div>
    </div>
  );
};