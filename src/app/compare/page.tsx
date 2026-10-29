import type { Metadata } from "next";
import Compare from "@/components/Compare";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Compare apps · ${BRAND.name}` };

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const { apps } = await searchParams;
  return <Compare apps={typeof apps === "string" ? apps : ""} />;
}
