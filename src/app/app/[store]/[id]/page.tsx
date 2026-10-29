import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Report from "@/components/Report";
import { BRAND } from "@/lib/config";

function safeDecode(v: string): string | null {
  try {
    return decodeURIComponent(v);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/app/[store]/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `${safeDecode(id) ?? "App"}: review report · ${BRAND.name}` };
}

export default async function AppReportPage({ params }: PageProps<"/app/[store]/[id]">) {
  const { store, id } = await params;
  const decoded = safeDecode(id);
  if ((store !== "play" && store !== "ios") || !decoded) notFound();
  return <Report store={store} id={decoded} />;
}
