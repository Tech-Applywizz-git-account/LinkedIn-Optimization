import { NextResponse } from "next/server";
import { rewriteResumeText } from "@/lib/textRewrite";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = String(body?.text || "");
    if (!text.trim()) return NextResponse.json({ error: "Empty text" }, { status: 400 });
    const out = rewriteResumeText(text);
    return NextResponse.json({ ok: true, text: out });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
