import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const name = request.nextUrl.searchParams.get('name') || 'image.jpg';

  if (!url || !url.includes('r2.dev')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }

  const blob = await res.blob();
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
}
