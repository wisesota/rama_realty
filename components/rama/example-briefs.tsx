import { EditorialMedia, type EditorialMediaModel } from "@/components/rama/editorial-media";
import { ExampleBriefAction } from "@/components/rama/example-brief-action";

export type ExampleBriefId = "waterfront-routine" | "family-transition" | "calm-city-base" | "long-horizon";
export type ExampleBriefItem = { id: ExampleBriefId; title: string; brief: string; constraint: string; tradeoff: string };

export function ExampleBriefs({
  items,
  chooseLabel,
  constraintLabel,
  tradeoffLabel,
  mediaLabel,
  media,
}: {
  items: readonly ExampleBriefItem[];
  chooseLabel: string;
  constraintLabel: string;
  tradeoffLabel: string;
  mediaLabel: string;
  media: Readonly<Record<ExampleBriefId, EditorialMediaModel>>;
}) {
  return (
    <div className="example-briefs">
      {items.map((item, index) => (
        <article key={item.id}>
          <EditorialMedia
            media={media[item.id]}
            label={mediaLabel}
            sizes={index === 0 || index === 3
              ? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1240px) 58vw, 715px"
              : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1240px) 42vw, 515px"}
            className="example-briefs__media"
          />
          <div className="example-briefs__content">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <p>{item.brief}</p>
            <dl><div><dt>{constraintLabel}</dt><dd>{item.constraint}</dd></div><div><dt>{tradeoffLabel}</dt><dd>{item.tradeoff}</dd></div></dl>
            <ExampleBriefAction brief={item.brief} label={chooseLabel} title={item.title} />
          </div>
        </article>
      ))}
    </div>
  );
}
