import { systemPrompt } from "@/lib/prompts/systemprompt";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import prisma  from "@/db";

async function generateVideo(code: string, conversationId: string) {
    const video = await axios.post("/run-manim", {
        code: code,
        conversationId: conversationId
    });
    return video;
}


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

        console.log("prompt", prompt);
        console.log("system prompt", systemPrompt);

        const response = await ollama.chat({
            model: "llama3.2:1b",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ]
        });

        console.log("response", response);

        await prisma.message.create({ // TODO: add video generation here
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

        const userResponse =  NextResponse.json({ message: response.message.content }, { status: 200 });
        const video = await generateVideo(response.message.content, conversationId);

        await prisma.video.create({
            data: {
                thumbnailUrl: video.data.thumbnailUrl,
                message: {
                    connect: {
                        id: message.id
                    }
                }
            }
        });

        return NextResponse.json({ message: response.message.content, video: video.data.thumbnailUrl }, { status: 200 });
       
    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}