"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { Button, inputClass } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    const { error } = await getBrowserClient().auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 rounded-lg bg-bone p-8 shadow-sm">
        <div>
          <p className="eyebrow text-olive">Portfolio admin</p>
          <h1 className="display mt-3 text-4xl">Sign in</h1>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
