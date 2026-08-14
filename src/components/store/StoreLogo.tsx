import Image from "next/image";

export function StoreLogo({
  src,
  alt,
  size = 56,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white"
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} width={size} height={size} className="object-contain" />
    </div>
  );
}
