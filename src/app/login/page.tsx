"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error === "Invalid key" ? "Invalid access key" : "Login failed");
        return;
      }
      const from = searchParams.get("from") || "/";
      router.push(from);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-[var(--card-bg)] p-8" style={{ border: "1px solid var(--card-stroke)", boxShadow: "var(--card-shadow)" }}>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Ahoy Analytics Center</h1>
            <p className="mt-1 text-sm text-[var(--secondary-text)]">Enter your access key to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="access-key" className="mb-1.5 block text-xs font-medium text-[var(--secondary-text)]">
                Access Key
              </label>
              <input
                id="access-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter your access key"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--secondary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-[var(--negative)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
              <strong className="text-[var(--foreground)]">Authorized access only.</strong> This portal is restricted to authorized personnel. If you do not have an access key, please contact your administrator. All access is logged for security and compliance purposes.
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] text-[var(--secondary-text)]">
          © Ahoy Analytics Center · Secure access
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--background)]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
