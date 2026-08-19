export type SampleProperty = {
  id: string;
  name: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  feature: string;
  match: string;
  image: string;
  imageAlt: string;
};

export const sampleProperties: SampleProperty[] = [
  {
    id: "marina-promenade-residence",
    name: "Marina Promenade Residence",
    location: "Dubai Marina",
    price: "AED 2,800,000",
    beds: 2,
    baths: 2,
    area: "1,420 sq ft",
    feature: "Balcony · Marina walk",
    match: "Strong alignment with the waterfront, walkability, and two-bedroom brief.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=85&w=1200",
    imageAlt: "Illustrative contemporary residence with an open garden-facing living space",
  },
  {
    id: "boulevard-garden-apartment",
    name: "Boulevard Garden Apartment",
    location: "Downtown Dubai",
    price: "AED 3,000,000",
    beds: 2,
    baths: 2,
    area: "1,360 sq ft",
    feature: "Natural light · Study nook",
    match: "Closest sample for central access, morning light, and flexible work space.",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=85&w=1200",
    imageAlt: "Illustrative bright contemporary apartment interior with full-height windows",
  },
  {
    id: "palm-courtyard-residence",
    name: "Palm Courtyard Residence",
    location: "Palm Jumeirah",
    price: "AED 2,950,000",
    beds: 2,
    baths: 2,
    area: "1,510 sq ft",
    feature: "Terrace · Quieter setting",
    match: "A calmer lifestyle sample with outdoor space and convenient water access.",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=85&w=1200",
    imageAlt: "Illustrative modern residence with a private terrace and warm stone facade",
  },
];
