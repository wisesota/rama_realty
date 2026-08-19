# Shared layouts

## Root layout

`app/layout.tsx` loads Inter and Source Serif 4, exports Dubai property-discovery metadata, and imports the global shadcn/Tailwind theme.

## Header

`components/site-header.tsx` is absolutely positioned over the hero. Its internal rail uses the same 1200px content maximum and responsive gutters as the page. Desktop has centered navigation and a light CTA; the mobile menu opens a solid forest ruled panel.

## Footer

`components/site-footer.tsx` is a compact ink section with brand copy, navigation, and the prototype disclosure. It shares the 1200px rail.

## Page shell

`components/landing-page.tsx` owns the four content beats and the sample-property modal. No application shell, sidebar, or additional route exists.
