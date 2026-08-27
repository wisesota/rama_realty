import Image from "next/image";
import { MediaFrame } from "@/components/rama/media-frame";
import { cn } from "@/lib/utils";

export type EditorialMediaModel = {
  src: string;
  alt: string;
  caption: string;
};

export function EditorialMedia({
  media,
  label,
  sizes,
  aspect = "landscape",
  className,
}: {
  media: EditorialMediaModel;
  label: string;
  sizes: string;
  aspect?: "landscape" | "portrait" | "panorama";
  className?: string;
}) {
  return (
    <figure className={cn("editorial-media", className)} data-aspect={aspect}>
      <MediaFrame className="editorial-media__frame">
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={sizes}
          className="editorial-media__image"
        />
      </MediaFrame>
      <figcaption>
        <span>{label}</span>
        <p>{media.caption}</p>
      </figcaption>
    </figure>
  );
}
