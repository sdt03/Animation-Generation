import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();

    try {
        console.log('Received prompt:', prompt);
        return NextResponse.json({ message: 'Message received' }, { status: 200 });
    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}