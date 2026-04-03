import { NextRequest, NextResponse } from "next/server";
import { sanityWriteClient } from "@/lib/sanity/client";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await sanityWriteClient.create({
      _type: "subscriber",
      email,
      subscribedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
