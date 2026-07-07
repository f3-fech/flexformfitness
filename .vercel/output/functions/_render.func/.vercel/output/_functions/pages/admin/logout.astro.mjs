/* empty css                                        */
import { c as createComponent, b as createAstro } from '../../chunks/astro/server_nY3mcm2N.mjs';
import 'kleur/colors';
import 'clsx';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Logout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Logout;
  Astro2.cookies.delete("admin_token", {
    path: "/"
  });
  Astro2.cookies.delete("session_token", {
    path: "/"
  });
  return Astro2.redirect("/admin/login");
}, "C:/Users/javie/Documents/Proyectos/flexformfitness/src/pages/admin/logout.astro", void 0);

const $$file = "C:/Users/javie/Documents/Proyectos/flexformfitness/src/pages/admin/logout.astro";
const $$url = "/admin/logout";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Logout,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
