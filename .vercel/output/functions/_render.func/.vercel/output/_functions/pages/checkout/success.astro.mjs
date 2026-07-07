/* empty css                                        */
import { c as createComponent, e as renderComponent, d as renderHead, r as renderTemplate, b as createAstro } from '../../chunks/astro/server_nY3mcm2N.mjs';
import 'kleur/colors';
import { $ as $$SEO } from '../../chunks/SEO_H0cFbLAW.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Success = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Success;
  const sessionId = Astro2.url.searchParams.get("session_id") || "SIN_ID";
  return renderTemplate`<html lang="es"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${renderComponent($$result, "SEO", $$SEO, { "title": "\xA1Compra Completada!", "description": "Tu pedido ha sido recibido y procesado correctamente. Gracias por comprar en FlexForm Fitness." })}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">${renderHead()}</head> <body class="bg-slate-50 text-slate-900 font-sans min-h-screen antialiased flex flex-col justify-between"> <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6"> <div class="max-w-7xl mx-auto flex justify-between items-center"> <a href="/" class="text-xl font-bold text-brand-900 tracking-tight flex items-center gap-2"> <span class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-extrabold text-sm">F</span>
FlexForm <span class="text-brand-600">Fitness</span> </a> </div> </header> <main class="max-w-md mx-auto px-6 py-16 flex-grow flex flex-col items-center justify-center text-center"> <div class="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-sm"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10"> <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path> </svg> </div> <h1 class="text-3xl font-extrabold text-slate-950 tracking-tight mb-3">
¡Gracias por tu compra!
</h1> <p class="text-slate-600 text-sm mb-8 leading-relaxed">
Tu pedido ha sido procesado con éxito. Hemos enviado un correo electrónico de confirmación con los detalles de tu compra.
</p> <div class="w-full p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-left flex flex-col gap-2 mb-8"> <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID de Transacción</span> <span class="text-xs font-mono text-slate-700 break-all select-all">${sessionId}</span> </div> <a href="/" class="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-md active:scale-95">
Volver a la Tienda
</a> </main> <footer class="bg-white border-t border-slate-100 py-8 px-6 text-center text-sm text-slate-400 mt-20"> <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} FlexForm Fitness. Todos los derechos reservados.</p> </footer>   </body> </html>`;
}, "C:/Users/javie/Documents/Proyectos/flexformfitness/src/pages/checkout/success.astro", void 0);

const $$file = "C:/Users/javie/Documents/Proyectos/flexformfitness/src/pages/checkout/success.astro";
const $$url = "/checkout/success";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Success,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
