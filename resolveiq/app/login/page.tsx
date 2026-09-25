"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();

formData.append("username", username);
formData.append("password", password);

const response = await fetch(
  `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  }
);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid username or password");
      }

      localStorage.setItem("access_token", data.access_token);

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090b10] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            R
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Welcome to ResolveIQ
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Sign in to your support operations dashboard
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#11141b] p-7 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                required
                className="w-full rounded-lg border border-zinc-700 bg-[#0b0e13] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg border border-zinc-700 bg-[#0b0e13] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          ResolveIQ · Support Operations Intelligence
        </p>
      </div>
    </main>
  );
}