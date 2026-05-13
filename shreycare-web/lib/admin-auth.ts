import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function isAuthorized(req: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const header = req.headers.get("x-admin-secret");
  if (header === ADMIN_SECRET) return true;
  const cookie = req.cookies.get("admin_secret")?.value;
  return cookie === ADMIN_SECRET;
}
