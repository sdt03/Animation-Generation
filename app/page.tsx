import { Textbox } from "@/components/chat/textbox";
import { Header } from "@/components/header";
import { Hero } from "@/components/landing/hero";

export default function Home() {
  return (
    <div className="bg-black min-h-screen">
      <div className="p-10 bg-black">
        <Header />
      </div>
      <Hero />
      <div className="flex justify-center items-center mt-20">
        <Textbox />
      </div>
    </div>
  );
}