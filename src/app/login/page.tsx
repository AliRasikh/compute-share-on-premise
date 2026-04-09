import type { Metadata } from "next";
import Link from "next/link";
import { AuthMainBackdrop } from "@/components/AuthMainBackdrop";
import { BaseLayout } from "@/components/BaseLayout";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in | Corimb",
  description: "Sign in to Corimb.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-1 flex-col">
      <BaseLayout
        headerEyebrow={null}
        headerShowProfileButton={false}
        headerShowNavigation={false}
        mainClassName="flex min-h-0 flex-1 flex-col overflow-auto p-0"
      >
        <AuthMainBackdrop>
          <div className="w-full max-w-sm mx-auto mb-4 rounded-xl bg-emerald-500/90 backdrop-blur border border-emerald-400/50 px-5 py-4 text-white shadow-lg">
            <div className="flex items-center gap-2.5 mb-1.5">
              <svg className="w-5 h-5 text-emerald-100 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold text-sm">Demo Account Available</p>
            </div>
            <p className="text-sm text-emerald-50 leading-relaxed">
              Try the platform with username <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">demo</span> and password <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">demo1234</span>
            </p>
          </div>
          <LoginForm />
          <Link
            href="/"
            className="text-center text-sm font-medium text-blue-200 transition hover:text-white"
          >
            Back to home
          </Link>
        </AuthMainBackdrop>
      </BaseLayout>
    </div>
  );
}
