"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/account/orders");
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
        <p className="text-on-surface-variant mt-2">Sign in to your ShreyCare Organics account</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-surface-container-high" />
        <span className="text-xs text-on-surface-variant uppercase tracking-widest">sign in with email</span>
        <div className="flex-1 h-px bg-surface-container-high" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input id="email" name="email" label="Email" type="email" required />
        <Input id="password" name="password" label="Password" type="password" required />
        {error && <p className="text-error text-sm">{error}</p>}
        <Button type="submit" className="w-full">Sign In</Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary font-bold">Create one</Link>
      </p>
    </div>
  );
}
