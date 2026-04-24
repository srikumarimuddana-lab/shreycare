import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "contact@shreycare.com";
const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  "ShreyCare Organics <no-reply@shreycare.com>";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [SUPPORT_EMAIL],
      // One-click reply goes straight to the customer.
      replyTo: email,
      subject: `Contact Form: ${subject || "General Inquiry"}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    });

    if (result.error) {
      console.error("[contact] Resend error:", result.error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
