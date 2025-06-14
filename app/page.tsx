import { Header } from "@/components/header";
import { Hero } from "@/components/landing/hero";

export default function Home() {
  return (
    <div className="bg-black h-screen">
      <div className="p-10 bg-black">
        <Header />
      </div>
      <Hero />
    </div>
  );
}