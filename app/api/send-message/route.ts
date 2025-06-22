import { systemPrompt } from "@/lib/prompts/systemprompt";
import { getCleanCode } from "@/lib/utils";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import prisma  from "@/db";

async function generateVideo(code: string, conversationId: string) {
    console.log("🎬 Sending clean code to sandbox:");
    console.log("=".repeat(50));
    console.log(code);
    console.log("=".repeat(50));
    
    const video = await axios.post("http://localhost:8000/run-manim", {
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

        console.log("📤 User prompt:", prompt);
        console.log("🤖 System prompt:", systemPrompt);

        const response = await ollama.chat({
            model: "llama3.2:1b",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ]
        });

        console.log("🤖 LLM response:", response);

        await prisma.message.create({
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

        console.log("📝 Full LLM response:", response.message.content);

        // Extract clean code from the LLM response
        const cleanCode = getCleanCode(response.message.content);
        console.log("🔍 Extracted clean code:");
        console.log("=".repeat(40));
        console.log(cleanCode);
        console.log("=".repeat(40));

        // Generate video with clean code only
        const video = await generateVideo(cleanCode, conversationId);

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

        return NextResponse.json({ 
            message: response.message.content, 
            video: video.data.thumbnailUrl,
            cleanCode: cleanCode // Optional: include clean code in response for debugging
        }, { status: 200 });
       
    } catch (error) {
        console.error('❌ Error in chat API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}