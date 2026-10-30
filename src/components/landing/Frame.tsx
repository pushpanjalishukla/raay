import Image, { type StaticImageData } from "next/image";

/** A real product screenshot in a soft frame, fading out at the bottom. */
export default function Frame({
  src,
  alt,
  priority = false,
  fade = true,
  sizes = "(max-width: 1200px) 100vw, 1150px",
}: {
  src: StaticImageData;
  alt: string;
  priority?: boolean;
  fade?: boolean;
  sizes?: string;
}) {
  return (
    <div
      className={`rounded-[20px] bg-white/70 p-1.5 sm:p-2 ring-1 ring-black/[0.06] shadow-[0_50px_120px_-50px_rgba(20,16,10,0.45)] dark:bg-white/[0.06] dark:ring-white/10 ${fade ? "frame-fade" : ""}`}
    >
      <div className="overflow-hidden rounded-[14px] ring-1 ring-black/[0.06]">
        <Image src={src} alt={alt} priority={priority} sizes={sizes} placeholder="blur" className="block w-full h-auto" />
      </div>
    </div>
  );
}
