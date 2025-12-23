import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Implement Hostaway API integration
  return NextResponse.json(
    { message: 'Hostaway reviews endpoint' },
    { status: 200 }
  );
}

export async function POST() {
  // TODO: Implement review submission
  return NextResponse.json(
    { message: 'Review submitted successfully' },
    { status: 201 }
  );
}
