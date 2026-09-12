/**
 * ============================================================================
 *  data.ts — the single source of truth for every piece of copy, product,
 *  theme token and animation constant on the site.
 * ============================================================================
 *
 *  WHY A DATA FILE AT ALL?
 *  On an award-style site the layout code is dense with animation logic. If you
 *  also inline the copy, every text tweak means touching a file full of
 *  timelines — and you inevitably break a stagger. Keeping content here means:
 *
 *   1. Components stay purely about *motion + layout*.
 *   2. Copy changes never risk an animation regression.
 *   3. Every list is typed, so a product card can never render `undefined`.
 *   4. Swapping this file for a CMS/Shopify fetch later is a one-import change:
 *      the component contracts (the exported types) do not move.
 */

/* ---------------------------------------------------------------------------
 * 1. THEME SYSTEM
 * -------------------------------------------------------------------------
 * The real OUTFIT site ships several full-page colour skins. Rather than write
 * `cream:bg-[#ede4dd] dark:bg-black blue:bg-white` on every element (which is
 * how this project started, and which does not scale past ~3 themes), each
 * theme is a *token set*. `<html data-theme="...">` swaps the CSS custom
 * properties in globals.css and the entire page re-skins for free.
 *
 *  - bg / fg      : page ground + main ink
 *  - accent       : the colour the nav resolves to under mix-blend-difference
 *                   (accent === invert(bg), which is why it looks electric)
 *  - muted        : hairlines, borders, disabled text
 */
export type ThemeName = "cream" | "dark" | "blue";

export interface Theme {
  name: ThemeName;
  /** Human label shown in the switcher tooltip */
  label: string;
  /** The dot colour in the switcher UI */
  swatch: string;
  tokens: {
    bg: string;
    fg: string;
    accent: string;
    muted: string;
  };
}

export const THEMES: Theme[] = [
  {
    name: "cream",
    label: "Cream",
    swatch: "#ff0001",
    tokens: {
      bg: "#ede4dd",
      fg: "#ff0001",
      accent: "#00ffff", // invert(#ff0001) — what mix-blend-difference produces
      muted: "#c9b9ac",
    },
  },
  {
    name: "dark",
    label: "Dark",
    swatch: "#ede4dd",
    tokens: {
      bg: "#050505",
      fg: "#ede4dd",
      accent: "#ede4dd",
      muted: "#3a3a3a",
    },
  },
  {
    name: "blue",
    label: "Blue",
    swatch: "#0040ff",
    tokens: {
      bg: "#ffffff",
      fg: "#0040ff",
      accent: "#ffd900", // invert(#0040ff)
      muted: "#bcc9f5",
    },
  },
];

export const DEFAULT_THEME: ThemeName = "cream";

/** Key used in localStorage AND in the no-flash inline script in layout.tsx */
export const THEME_STORAGE_KEY = "outfit-theme";

/* ---------------------------------------------------------------------------
 * 2. BRAND + NAVIGATION
 * ------------------------------------------------------------------------- */
export const SITE = {
  name: "OUTFIT®",
  wordmark: "Outfit",
  tagline: "Signature collection by ++hellohello",
  /** The real strapline from the source site */
  intro:
    "Created by the ++hellohello team, this store and signature collection celebrates our collective creativity and passion for apparel. Carefully designed.",
  url: "https://outfit.hellohello.is",
  studio: "++hellohello",
  studioUrl: "https://www.hellohello.is",
  location: "Montevideo, UY",
  email: "hola@hellohello.is",
  year: "2026",
} as const;

export interface NavLink {
  label: string;
  href: string;
  /** Index shown as a monospace ordinal, e.g. "01" */
  index: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Index", href: "/", index: "01" },
  { label: "Shop", href: "/shop", index: "02" },
  { label: "Studio", href: "/about", index: "03" },
  { label: "Contact", href: "/contact", index: "04" },
];

/* ---------------------------------------------------------------------------
 * 3. PRODUCTS
 * -------------------------------------------------------------------------
 * `slug` drives the /product/[slug] dynamic route.
 * `images` are indexes into the /public/image-0N.avif set.
 */
export interface Product {
  id: number;
  slug: string;
  name: string;
  /** Short type line, e.g. "Heavyweight tee" */
  category: string;
  price: number;
  currency: string;
  /** Editorial paragraph on the detail page */
  description: string;
  /** Bullet spec list */
  details: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  /** Marked items get the oversized treatment in the featured grid */
  featured: boolean;
  soldOut?: boolean;
  /** Drives the little rotating badge */
  badge?: string;
}

const img = (n: number) => `/image-0${n}.avif`;

export const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "whitespace-matters",
    name: "Whitespace Matters",
    category: "Heavyweight tee",
    price: 33,
    currency: "USD",
    description:
      "The one that started the collection. A 240gsm carded cotton tee with a boxy, slightly cropped body — the negative space around the print is doing as much work as the print itself.",
    details: [
      "240gsm carded cotton, garment dyed",
      "Boxy fit, dropped shoulder",
      "Screen-printed chest mark",
      "Made in Uruguay",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Bone", hex: "#ede4dd" },
      { name: "Signal", hex: "#ff0001" },
    ],
    images: [img(1), img(4), img(2)],
    featured: true,
    badge: "Signature",
  },
  {
    id: 2,
    slug: "kerning-crew",
    name: "Kerning Crew",
    category: "Boxy crewneck",
    price: 78,
    currency: "USD",
    description:
      "A 400gsm brushed-back crewneck for people who have opinions about letter spacing. Ribbed collar that survives the wash, and a type treatment that sits exactly where it should.",
    details: [
      "400gsm brushed-back fleece",
      "Relaxed body, ribbed cuffs",
      "Embroidered wordmark",
      "Pre-shrunk",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Ash", hex: "#c9b9ac" },
      { name: "Ink", hex: "#050505" },
    ],
    images: [img(2), img(5), img(3)],
    featured: true,
  },
  {
    id: 3,
    slug: "above-the-fold",
    name: "Above The Fold",
    category: "Cotton cap",
    price: 42,
    currency: "USD",
    description:
      "Six-panel, unstructured, washed twill. Sits low. The only thing above the fold is the brim.",
    details: [
      "Washed cotton twill",
      "Unstructured six-panel",
      "Antique brass closure",
      "One size",
    ],
    sizes: ["OS"],
    colors: [
      { name: "Bone", hex: "#ede4dd" },
      { name: "Klein", hex: "#0040ff" },
    ],
    images: [img(3), img(6)],
    featured: false,
  },
  {
    id: 4,
    slug: "ship-it",
    name: "Ship It",
    category: "Heavyweight hoodie",
    price: 115,
    currency: "USD",
    description:
      "The heaviest thing we make. 500gsm double-layer hood, kangaroo pocket deep enough for a laptop charger and your regrets. Print reads SHIP IT across the back.",
    details: [
      "500gsm loopback cotton",
      "Double-layer hood, flat drawcord",
      "Back screen print",
      "Boxy oversized fit",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ink", hex: "#050505" },
      { name: "Bone", hex: "#ede4dd" },
    ],
    images: [img(4), img(1), img(5)],
    featured: true,
    badge: "New",
  },
  {
    id: 5,
    slug: "lorem-ipsum",
    name: "Lorem Ipsum",
    category: "Longsleeve",
    price: 56,
    currency: "USD",
    description:
      "Placeholder text, permanent garment. A 220gsm longsleeve with the full first paragraph set at 6pt down the left sleeve. Nobody will read it. That is the joke.",
    details: [
      "220gsm combed cotton",
      "Sleeve micro-type print",
      "Straight body",
      "Made in Uruguay",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Bone", hex: "#ede4dd" }],
    images: [img(5), img(2)],
    featured: false,
  },
  {
    id: 6,
    slug: "no-hover-states",
    name: "No Hover States",
    category: "Tote",
    price: 28,
    currency: "USD",
    description:
      "16oz canvas tote for the touch-device generation. Gusseted base, webbing handles, no interaction required.",
    details: ["16oz natural canvas", "Gusseted base", "Webbing handles", "38 × 42 × 12 cm"],
    sizes: ["OS"],
    colors: [{ name: "Natural", hex: "#e8dfd2" }],
    images: [img(6), img(3)],
    featured: false,
  },
  {
    id: 7,
    slug: "grid-system",
    name: "Grid System",
    category: "Work jacket",
    price: 168,
    currency: "USD",
    description:
      "A chore coat cut on a twelve-column grid — four patch pockets, two chest, all aligned to the same baseline. Overbuilt on purpose.",
    details: [
      "12oz cotton canvas",
      "Four patch pockets",
      "Corozo buttons",
      "Unlined",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Ink", hex: "#050505" }],
    images: [img(1), img(6)],
    featured: false,
    soldOut: true,
  },
  {
    id: 8,
    slug: "deploy-friday",
    name: "Deploy Friday",
    category: "Sweatpant",
    price: 92,
    currency: "USD",
    description:
      "400gsm brushed-back sweatpant with a tapered leg. For the kind of confidence that pushes to main at 5pm on a Friday.",
    details: [
      "400gsm brushed-back fleece",
      "Tapered leg, elastic cuff",
      "Side seam pockets",
      "Drawcord waist",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Ash", hex: "#c9b9ac" },
      { name: "Ink", hex: "#050505" },
    ],
    images: [img(2), img(4)],
    featured: false,
  },
];

export const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.featured);

export const getProductBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((p) => p.slug === slug);

/* ---------------------------------------------------------------------------
 * 4. MARQUEE / TICKER STRIPS
 * ------------------------------------------------------------------------- */
export const MARQUEE_ITEMS = [
  "Free shipping over $150",
  "Signature collection",
  "Made in Uruguay",
  "Limited run",
  "OUTFIT®",
  "Est. 2026",
];

/* ---------------------------------------------------------------------------
 * 5. HOME SECTIONS
 * ------------------------------------------------------------------------- */

/** The pinned, word-by-word manifesto. Each string is one line. */
export const MANIFESTO_LINES = [
  "We make clothes",
  "the way we make",
  "websites — obsessively,",
  "and slightly too heavy.",
];

export interface StatItem {
  value: string;
  label: string;
  /** Numeric target for the count-up; omit for non-numeric values */
  count?: number;
  suffix?: string;
}

export const STATS: StatItem[] = [
  { value: "240", label: "gsm minimum", count: 240 },
  { value: "8", label: "pieces in the drop", count: 8 },
  { value: "100", label: "% cotton", count: 100, suffix: "%" },
  { value: "1", label: "studio, one city", count: 1 },
];

/** Horizontal-scroll chapter cards */
export interface Chapter {
  index: string;
  title: string;
  copy: string;
  image: string;
}

export const CHAPTERS: Chapter[] = [
  {
    index: "01",
    title: "Fabric first",
    copy:
      "We pick the cloth before we draw anything. Heavyweight, garment dyed, and pre-shrunk so the fit you buy is the fit you keep.",
    image: img(1),
  },
  {
    index: "02",
    title: "Type as pattern",
    copy:
      "Every graphic in the collection is set, not illustrated. The wordmark, the spec sheet, the care label — all one type system.",
    image: img(2),
  },
  {
    index: "03",
    title: "Short runs",
    copy:
      "Each piece is produced in a run of two hundred. When it is gone it stays gone; we would rather sell out than discount.",
    image: img(3),
  },
  {
    index: "04",
    title: "Made close",
    copy:
      "Cut and sewn twenty minutes from the studio, which means we can walk over and argue about a seam allowance in person.",
    image: img(4),
  },
];

/** Lookbook — full-bleed parallax pairs */
export const LOOKBOOK = [
  { image: img(5), caption: "Look 01 — Whitespace Matters / Above The Fold" },
  { image: img(3), caption: "Look 02 — Kerning Crew" },
  { image: img(6), caption: "Look 03 — Ship It / Deploy Friday" },
  { image: img(2), caption: "Look 04 — Lorem Ipsum" },
];

/* ---------------------------------------------------------------------------
 * 6. STUDIO / ABOUT
 * ------------------------------------------------------------------------- */
export const ABOUT = {
  heading: "Studio",
  lead:
    "++hellohello is a design and technology studio in Montevideo. We build digital products for people who care how things move. OUTFIT is what happens when we point that attention at clothing instead of screens.",
  paragraphs: [
    "The collection began as studio merch — six tees printed for ourselves because we wanted something to wear to a conference that did not have a client logo on it. People asked where to buy them. So we built a shop.",
    "Everything here is designed in-house, produced in short runs, and made within a twenty minute drive of the studio. We treat a seam allowance the way we treat an easing curve: it is either considered or it is wrong.",
  ],
  credits: [
    { role: "Design", name: "++hellohello" },
    { role: "Direction", name: "Pablo Picart" },
    { role: "Build", name: "SEB®" },
    { role: "Type", name: "Inter / Geist Mono" },
  ],
} as const;

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  {
    q: "How does sizing run?",
    a: "Boxy and true to size. If you want the oversized look the studio wears, take one size up — the tees in particular are cut wide through the chest.",
  },
  {
    q: "Where do you ship?",
    a: "Worldwide. Free over $150 USD. South America ships in 2–4 days, everywhere else 7–12 depending on customs.",
  },
  {
    q: "Will sold-out pieces come back?",
    a: "Usually not. Each piece is a run of two hundred; when it sells through we move on to the next one rather than restocking.",
  },
  {
    q: "Can we collaborate?",
    a: "Yes — studio, brand or artist. Mail us and tell us what you want to make.",
  },
];

/* ---------------------------------------------------------------------------
 * 7. FOOTER
 * ------------------------------------------------------------------------- */
export const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All pieces", href: "/shop" },
      { label: "Tees", href: "/shop" },
      { label: "Knitwear", href: "/shop" },
      { label: "Accessories", href: "/shop" },
    ],
  },
  {
    title: "Info",
    links: [
      { label: "Studio", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Shipping", href: "/contact" },
      { label: "Returns", href: "/contact" },
    ],
  },
];

export const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Are.na", href: "https://are.na" },
  { label: "Read.cv", href: "https://read.cv" },
];

/* ---------------------------------------------------------------------------
 * 8. MOTION CONSTANTS
 * -------------------------------------------------------------------------
 * Every duration and easing name used by the site lives here so the whole
 * site can be re-timed from one place. When a reviewer says "the intro feels
 * slow", you change one number, not fourteen timelines.
 */
export const MOTION = {
  /** Named CustomEase curves — created once in lib/gsap.ts */
  ease: {
    /** The workhorse: fast out, hard stop. Used for reveals. */
    hop: "hop",
    /** Softer, for large surfaces (curtains, clip-paths) */
    glide: "glide",
    /** Almost-linear with a kick — for marquee handoffs */
    drift: "drift",
  },
  duration: {
    preloaderHold: 2.6,
    curtain: 0.75,
    reveal: 0.9,
    stagger: 0.06,
    /**
     * Absolute position (in seconds, on the shared master timeline) where
     * the hero's reveal begins. The preloader's own sequence runs ~3.8s, and
     * its curtain starts lifting around 3.05s — so starting the hero at 3.25
     * makes the headline rise WHILE the curtain is still travelling.
     *
     * Why an absolute number instead of the idiomatic relative `"-=0.55"`?
     * Because a relative offset is measured against the master timeline's
     * duration AT THE MOMENT IT IS APPENDED — which silently depends on the
     * preloader's effect having already run. That ordering holds today (React
     * runs sibling layout effects in render order, and <Preloader/> is
     * declared before <Hero/>), but it is invisible, unenforceable, and breaks
     * the moment someone reorders two lines of JSX. One tunable constant is
     * worth more than one clever string.
     */
    heroHandoff: 3.25,
  },
  /** Lenis smooth-scroll tuning */
  lenis: {
    duration: 1.05,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  },
} as const;
