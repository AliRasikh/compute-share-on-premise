import type { Metadata } from "next";
import Link from "next/link";
import { AuthMainBackdrop } from "@/components/AuthMainBackdrop";
import { BaseLayout } from "@/components/BaseLayout";

export const metadata: Metadata = {
  title: "Create account | Corimb",
  description: "Create a Corimb account.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full flex-1 flex-col">
      <BaseLayout
        headerEyebrow={null}
        headerShowProfileButton={false}
        headerShowNavigation={false}
        mainClassName="flex min-h-0 flex-1 flex-col overflow-auto p-0"
      >
        <AuthMainBackdrop>
          <div className="text-center">
            <p className="text-sm text-slate-200">Registration will be available here.</p>
          </div>
          <Link
            href="/login"
            className="text-center text-sm font-medium text-blue-200 transition hover:text-white"
          >
            Back to log in
          </Link>
        </AuthMainBackdrop>
      </BaseLayout>
    </div>
  );
}
