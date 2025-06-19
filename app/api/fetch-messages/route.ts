import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
        }
        
        // Verify the conversation belongs to the user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: session.user.id
            }
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        // Fetch all messages for the conversation
        const messages = await prisma.message.findMany({
            where: {
                conversationId: conversationId
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        
        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" }, 
            { status: 500 }
        );
    }
} 