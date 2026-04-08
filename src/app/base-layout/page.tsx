import type { Metadata } from "next";
import { BaseLayout } from "@/components/BaseLayout";

export const metadata: Metadata = {
  title: "Base layout",
  description: "Empty shell demo: scrollable main at 200% viewport height.",
};

export default function BaseLayoutDemoPage() {
  return (
    <div className="flex min-h-screen w-full flex-1 flex-col">
      <BaseLayout headerTitle="Base layout (demo)">
        {/* Empty main: 200vh spacer to exercise header/footer + scroll */}
        <div className="min-h-[200vh] w-full shrink-0" aria-hidden />
      </BaseLayout>
    </div>
  );
}
