import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { sendOTPEmail } from "@/lib/email";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.endsWith("@applywizz.ai")) {
      return NextResponse.json({ error: "Only @applywizz.ai emails are allowed." }, { status: 400 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create a short-lived token (15 minutes) containing the OTP hash/value
    const token = await signToken({ email, otp }, "15m");

    // Set the OTP in a cookie so we can verify it later
    const cookieStore = await cookies();
    cookieStore.set({
      name: "otp_pending",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    // Send the email
    await sendOTPEmail(email, otp);

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
