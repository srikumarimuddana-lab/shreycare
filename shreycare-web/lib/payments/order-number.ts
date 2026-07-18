import { supabaseAdmin } from "@/lib/supabase";

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SC-${code}`;
}

export async function generateUniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const num = randomCode();
    const { data } = await supabaseAdmin
      .from("sales")
      .select("id")
      .eq("order_number", num)
      .limit(1);
    if (!data || data.length === 0) return num;
  }
  return `SC-${Date.now().toString(36).toUpperCase()}`;
}
