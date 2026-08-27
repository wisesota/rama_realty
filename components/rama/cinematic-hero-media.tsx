export function CinematicHeroMedia() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/images/rama-dubai-residential-cityscape-mobile-720.avif"
        imageSrcSet="/images/rama-dubai-residential-cityscape-mobile-720.avif 720w, /images/rama-dubai-residential-cityscape-mobile-1080.avif 1080w, /images/rama-dubai-residential-cityscape-mobile-1440.avif 1440w"
        imageSizes="100vw"
        media="(max-width: 700px)"
        type="image/avif"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/images/rama-dubai-residential-cityscape-hero-1280.avif"
        imageSrcSet="/images/rama-dubai-residential-cityscape-hero-1280.avif 1280w, /images/rama-dubai-residential-cityscape-hero-1920.avif 1920w, /images/rama-dubai-residential-cityscape-hero-2560.avif 2560w"
        imageSizes="100vw"
        media="(min-width: 701px)"
        type="image/avif"
        fetchPriority="high"
      />
      <div className="cinematic-hero-media">
      <picture className="cinematic-hero-media__picture">
        <source
          media="(max-width: 700px)"
          srcSet="/images/rama-dubai-residential-cityscape-mobile-720.avif 720w, /images/rama-dubai-residential-cityscape-mobile-1080.avif 1080w, /images/rama-dubai-residential-cityscape-mobile-1440.avif 1440w"
          sizes="100vw"
          type="image/avif"
        />
        <source
          media="(max-width: 700px)"
          srcSet="/images/rama-dubai-residential-cityscape-mobile-720.webp 720w, /images/rama-dubai-residential-cityscape-mobile-1080.webp 1080w, /images/rama-dubai-residential-cityscape-mobile-1440.webp 1440w"
          sizes="100vw"
          type="image/webp"
        />
        <source
          media="(min-width: 701px)"
          srcSet="/images/rama-dubai-residential-cityscape-hero-1280.avif 1280w, /images/rama-dubai-residential-cityscape-hero-1920.avif 1920w, /images/rama-dubai-residential-cityscape-hero-2560.avif 2560w"
          sizes="100vw"
          type="image/avif"
        />
        <source
          media="(min-width: 701px)"
          srcSet="/images/rama-dubai-residential-cityscape-hero-1280.webp 1280w, /images/rama-dubai-residential-cityscape-hero-1920.webp 1920w, /images/rama-dubai-residential-cityscape-hero-2560.webp 2560w"
          sizes="100vw"
          type="image/webp"
        />
        <img
          src="/images/rama-dubai-residential-cityscape-hero-1280.webp"
          width="2560"
          height="1440"
          alt=""
          aria-hidden="true"
          className="cinematic-hero-media__image"
          decoding="async"
          draggable={false}
          fetchPriority="high"
          loading="eager"
        />
      </picture>
      <div className="cinematic-hero-media__wash" aria-hidden="true" />
      <div className="cinematic-hero-media__vignette" aria-hidden="true" />
      </div>
    </>
  );
}
