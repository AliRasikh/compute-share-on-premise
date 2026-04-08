import type { Metadata } from "next";
import { HomePageClient } from "./HomePageClient";

export const metadata: Metadata = {
  title: "Home | Compute Exchange",
  description: "Trade compute, run workloads, and explore partnership on Compute Exchange.",
};

export default function HomePage() {
  return <HomePageClient />;
}
