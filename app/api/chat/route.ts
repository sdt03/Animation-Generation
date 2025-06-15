import { systemPrompt } from "@/lib/prompts/systemprompt";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();

    const formattedPrompt = systemPrompt + "\n\n" + prompt;

    try {
        const response = await ollama.chat({
            model: "llama3.1:8b",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ]
        });

        console.log(response.message.content);

        return NextResponse.json({ message: response.message.content }, { status: 200 });
    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}