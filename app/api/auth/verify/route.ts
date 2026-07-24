import { NextResponse } from "next/server";
import { verifyToken, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const pendingToken = cookieStore.get("otp_pending")?.value;

    if (!pendingToken) {
      return NextResponse.json({ error: "OTP session expired. Please request a new one." }, { status: 400 });
    }

    // Verify the JWT containing the OTP
    const payload = await verifyToken(pendingToken);
    
    if (!payload || payload.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    const email = payload.email as string;

    // Create the final session token (7 days)
    const sessionToken = await signToken({ email }, "7d");

    // Set auth_session cookie
    cookieStore.set({
      name: "auth_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Clear the pending OTP cookie
    cookieStore.delete("otp_pending");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 400 });
  }
}
