import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: null, // Will be set later based on first message
      },
    });

    return NextResponse.json({ 
      conversationId: conversation.id 
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating new chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 