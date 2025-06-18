import { systemPrompt } from "@/lib/prompts/systemprompt";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import prisma  from "@/db";


export async function POST(req: NextRequest) {
    const { conversationId, prompt } = await req.json();

    const formattedPrompt = systemPrompt + "\n\n" + prompt;

    try {
        const message = await prisma.message.create({
            data: {
                content: prompt,
                sender: "user",
                conversation: {
                    connect: {
                        id: conversationId
                    }
                }
            },
        })


        const response = await ollama.chat({
            model: "llama3.2:1b",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ]
        });

        const aiResponse = await prisma.message.create({ // TODO: add video generation here
            data: {
                content: response.message.content,
                sender: "llm",
                conversation: {
                    connect: {
                        id: conversationId
                    }
                }
            },
        });

        const title = await ollama.chat({
            model: "llama3.2:1b",
            messages: [
                { role: "system", content: "Using the following user prompt, generate a title for the conversation" },
                { role: "user", content: prompt }
            ]
        });

        await prisma.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                title: title.message.content
            }
        })

        console.log("system prompt", systemPrompt);
        console.log("prompt", prompt);

        console.log(response.message.content);

        return NextResponse.json({ message: response.message.content }, { status: 200 });
    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}