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
