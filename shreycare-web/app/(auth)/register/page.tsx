"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function RegisterPage() {
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
      setError("Registration failed. Please try again.");
    } else {
      router.push("/account/orders");
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Join the Atelier</h1>
        <p className="text-on-surface-variant mt-2">Create your ShreyCare Organics account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input id="name" name="name" label="Name" required />
        <Input id="email" name="email" label="Email" type="email" required />
        <Input id="password" name="password" label="Password" type="password" required />
        {error && <p className="text-error text-sm">{error}</p>}
        <Button type="submit" className="w-full">Create Account</Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-bold">Sign in</Link>
      </p>
    </div>
  );
}
