"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "w-full rounded-xl border border-(--neutral-300) bg-(--surface) px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-(--primary-500) focus:ring-2 focus:ring-(--primary-100)";

const DEMO_USER = "demo";
const DEMO_PASS = "demo1234";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username === DEMO_USER && password === DEMO_PASS) {
      sessionStorage.setItem("auth-user", username);
      router.push("/dashboard");
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <form className="card space-y-5 p-6 sm:p-8" onSubmit={handleSubmit} autoComplete="off">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <input
        id="login-username"
        name="username"
        type="text"
        autoComplete="off"
        required
        aria-label="Username"
        className={fieldClassName}
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        id="login-password"
        name="pin"
        type="text"
        autoComplete="off"
        required
        aria-label="Password"
        className={fieldClassName}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-(--primary-500) px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-(--primary-600) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary-600)"
      >
        Log in
      </button>
    </form>
  );
}
