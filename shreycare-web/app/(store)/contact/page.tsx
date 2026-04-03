"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BotanicalToast } from "@/components/ui/BotanicalToast";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: "info" | "success" | "error" }>({ visible: false, message: "", variant: "info" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus("success");
        setToast({ visible: true, message: "Message sent! We'll be in touch.", variant: "success" as const });
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
        setToast({ visible: true, message: "Failed to send. Please try again.", variant: "error" as const });
      }
    } catch {
      setStatus("error");
      setToast({ visible: true, message: "Something went wrong.", variant: "error" as const });
    }
  }

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-2xl">
        <div className="mb-12">
          <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
            Get in Touch
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Contact Us
          </h1>
          <p className="text-on-surface-variant mt-4 text-lg">
            Have a question about our products or your order? We&apos;d love to hear from you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input id="name" name="name" label="Name" placeholder="Your name" required />
          <Input id="email" name="email" label="Email" type="email" placeholder="you@example.com" required />
          <Input id="subject" name="subject" label="Subject" placeholder="How can we help?" />
          <Textarea id="message" name="message" label="Message" placeholder="Tell us more..." rows={6} required />
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>

      <BotanicalToast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </section>
  );
}
