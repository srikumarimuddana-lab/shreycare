import { NextRequest, NextResponse } from "next/server";

// Detect Regina visitors using Vercel's automatic geo headers so we can
// show them "FREE local delivery" in the cart before they reach checkout.
// Falls back silently when headers are absent (local dev, non-Vercel hosts).
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Vercel injects x-vercel-ip-city (URL-encoded, e.g. "Regina").
  const rawCity =
    request.headers.get("x-vercel-ip-city") ??
    (request as unknown as { geo?: { city?: string } }).geo?.city ??
    "";

  const city = decodeURIComponent(rawCity).trim().toLowerCase();

  if (city === "regina") {
    response.cookies.set("shreycare-is-regina", "1", {
      path: "/",
      sameSite: "lax",
      maxAge: 3600,
      httpOnly: false,
    });
  } else if (city !== "") {
    // Actively clear the cookie so a user who moved to another tab/city
    // doesn't retain the Regina flag.
    response.cookies.delete("shreycare-is-regina");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|webp|txt|xml|json)).*)"],
};
