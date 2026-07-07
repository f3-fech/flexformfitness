import { c as createComponent, a as addAttribute, r as renderTemplate, u as unescapeHTML, b as createAstro } from './astro/server_nY3mcm2N.mjs';
import 'kleur/colors';
import 'clsx';
import { g as getGeneralSettings } from './settings_C0jU3ASc.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$SEO = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$SEO;
  const {
    title,
    description,
    image = "/images/default-share.jpg",
    canonicalUrl = Astro2.url.href,
    ogType = "website",
    jsonLd
  } = Astro2.props;
  const siteName = "FlexForm Fitness";
  const fullTitle = `${title} | ${siteName}`;
  const settings = await getGeneralSettings();
  const faviconUrl = settings.faviconUrl || "/logo.png";
  return renderTemplate`<!-- Primary Meta Tags --><title>${fullTitle}</title><meta name="title"${addAttribute(fullTitle, "content")}><meta name="description"${addAttribute(description, "content")}><link rel="canonical"${addAttribute(canonicalUrl, "href")}><link rel="icon"${addAttribute(faviconUrl, "href")}><!-- Open Graph / Facebook --><meta property="og:type"${addAttribute(ogType, "content")}><meta property="og:url"${addAttribute(canonicalUrl, "content")}><meta property="og:title"${addAttribute(fullTitle, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:image"${addAttribute(new URL(image, Astro2.url.origin).href, "content")}><meta property="og:site_name"${addAttribute(siteName, "content")}><!-- Twitter --><meta property="twitter:card" content="summary_large_image"><meta property="twitter:url"${addAttribute(canonicalUrl, "content")}><meta property="twitter:title"${addAttribute(fullTitle, "content")}><meta property="twitter:description"${addAttribute(description, "content")}><meta property="twitter:image"${addAttribute(new URL(image, Astro2.url.origin).href, "content")}><!-- JSON-LD Structured Data -->${jsonLd && renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(jsonLd)))}`;
}, "C:/Users/javie/Documents/Proyectos/flexformfitness/src/components/SEO.astro", void 0);

export { $$SEO as $ };
