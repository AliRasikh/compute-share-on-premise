import type { Metadata } from "next";
import { HomePageClient } from "./home/HomePageClient";

export const metadata: Metadata = {
  title: "Home | Corimb",
  description: "Trade compute, run workloads, and explore partnership on Corimb.",
};

export default function HomePage() {
  return <HomePageClient />;
}
