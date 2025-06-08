import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/db";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        console.log(session);
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const conversations = await prisma.conversation.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        console.log("after conversations", conversations);
        if(!conversations) {
            console.log("no conversations found");
            return NextResponse.json({ error: "No conversations found" });
        }
        
        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversations" }, 
            { status: 500 }
        );
    }
}