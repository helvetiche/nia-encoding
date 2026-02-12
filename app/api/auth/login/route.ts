import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { verifyFirebaseUser } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'email and password required' },
        { status: 400 }
      );
    }

    const user = await verifyFirebaseUser(body.email);

    if (user) {
      return NextResponse.json({
        email: user.email,
        success: true,
        userId: user.uid,
      });
    }

    return NextResponse.json(
      { error: 'invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('login error:', error);
    return NextResponse.json(
      { error: 'server is broken' },
      { status: 500 }
    );
  }
}
