"use client";

import Link from "next/link";

const fieldClassName =
  "w-full rounded-xl border border-(--neutral-300) bg-(--surface) px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-(--primary-500) focus:ring-2 focus:ring-(--primary-100)";

export function LoginForm() {
  return (
    <form
      className="card space-y-5 p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        aria-label="Enter your email"
        className={fieldClassName}
        placeholder="Enter your email"
      />
      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        aria-label="Enter your password"
        className={fieldClassName}
        placeholder="Enter your password"
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-(--primary-500) px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-(--primary-600) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary-600)"
      >
        Log in
      </button>
      <p className="pt-1 text-center text-sm text-(--neutral-700)">
        <Link
          href="/register"
          className="font-medium text-(--primary-600) transition hover:text-(--primary-700)"
        >
          Create new account
        </Link>
      </p>
    </form>
  );
}
