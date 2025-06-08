"use client"
import { useState } from "react";
import { Textbox } from "./textbox";

interface ChatwindowProps {
    prompt: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function Chatwindow() {
    const [messages, setMessages] = useState<string[]>([]);

    const handleSend = (message: string) => {
        setMessages([...messages, message]);
    }

    return (
        <div className="h-3/4 w-1/3 mt-5 text-white border left-30">
            <h1>Chatwindow</h1>
        </div>
    )
}