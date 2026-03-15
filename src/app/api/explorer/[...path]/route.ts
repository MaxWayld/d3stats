import { NextRequest, NextResponse } from "next/server";

const EXPLORER = "https://explorer.doma.xyz/api/v2";

const ALLOWED = ["/tokens", "/addresses", "/stats", "/search", "/transactions", "/main-page"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = "/" + path.join("/");
  const search = request.nextUrl.searchParams.toString();
  const url = `${EXPLORER}${pathname}${search ? `?${search}` : ""}`;

  const isAllowed = ALLOWED.some(prefix => pathname.startsWith(prefix));
  if (!isAllowed) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Explorer API unavailable" }, { status: 502 });
  }
}
