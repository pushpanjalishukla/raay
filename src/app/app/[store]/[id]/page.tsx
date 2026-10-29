import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Report from "@/components/Report";
import { BRAND } from "@/lib/config";

export async function generateMetadata({ params }: PageProps<"/app/[store]/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `${decodeURIComponent(id)}: review report · ${BRAND.name}` };
}

export default async function AppReportPage({ params }: PageProps<"/app/[store]/[id]">) {
  const { store, id } = await params;
  if (store !== "play" && store !== "ios") notFound();
  return <Report store={store} id={decodeURIComponent(id)} />;
}
