/* empty css                                        */
import { c as createComponent, d as renderHead, a as addAttribute, r as renderTemplate, b as createAstro } from '../../chunks/astro/server_nY3mcm2N.mjs';
import 'kleur/colors';
import 'clsx';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  const user = Astro2.locals.user;
  if (user) {
    const { admin } = await import('../../chunks/firebase_CqeBG1kq.mjs');
    const superAdminEmail = "flexformfitness@gmail.com".trim().toLowerCase();
    let isAdmin = user.email.trim().toLowerCase() === superAdminEmail;
    if (!isAdmin) {
      try {
        const settingsSnap = await admin.firestore().collection("settings").doc("general").get();
        if (settingsSnap.exists) {
          const settings = settingsSnap.data();
          if (settings && Array.isArray(settings.admins)) {
            const normalizedAdmins = settings.admins.map((email) => email.trim().toLowerCase());
            if (normalizedAdmins.includes(user.email.trim().toLowerCase())) {
              isAdmin = true;
            }
          }
        }
      } catch (err) {
        console.error("Error verifying admin role in login page:", err);
      }
    }
    if (isAdmin) {
      return Astro2.redirect("/admin/dashboard");
    }
  }
  const errorParam = Astro2.url.searchParams.get("error");
  let errorMessage = "";
  if (errorParam === "unauthorized") {
    errorMessage = "Acceso denegado: tu cuenta no tiene permisos de administrador.";
  }
  return renderTemplate`<html lang="es"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Iniciar Sesión Admin | FlexForm</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">${renderHead()}</head> <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen font-sans antialiased p-6"> <div class="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-8"> <div class="text-center flex flex-col items-center"> <span class="inline-flex w-14 h-14 rounded-2xl bg-rose-600 items-center justify-center text-white font-extrabold text-2xl mb-4 shadow-md">F</span> <h1 class="text-2xl font-extrabold tracking-tight text-white uppercase">Panel de FlexForm</h1> <p class="text-slate-400 text-sm mt-1">Acceso restringido para administradores</p> </div> <!-- Error notification box --> <div id="error-box"${addAttribute(`${errorMessage ? "" : "hidden"} p-4 rounded-xl bg-red-950/50 border border-red-900/50 text-red-400 text-xs font-semibold text-center leading-relaxed`, "class")}> ${errorMessage} </div> <!-- Google Sign In Button --> <div class="w-full"> <button type="button" id="google-btn" class="w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-sm font-bold text-slate-300 hover:text-white shadow-sm active:scale-98 transition-all duration-200 gap-3"> <svg class="w-5 h-5" viewBox="0 0 24 24" width="24" height="24"> <path fill="#EA4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.78l3.39-3.39C17.84 1.54 15.11 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.96 3.07C6.18 7.73 8.84 5.04 12 5.04z"></path> <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.68-5.03 3.68-8.64z"></path> <path fill="#FBBC05" d="M5.2 13.91c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.24 6.26C.44 7.98 0 9.89 0 11.9s.44 3.92 1.24 5.64l3.96-3.63z"></path> <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.77-2.92c-1.11.75-2.53 1.19-4.19 1.19-3.16 0-5.82-2.69-6.8-5.75L1.24 16.2C3.2 20.27 7.24 23 12 23z"></path> </svg> <span>Continuar con Google</span> </button> </div> <!-- Separator --> <div class="relative"> <div class="absolute inset-0 flex items-center" aria-hidden="true"> <div class="w-full border-t border-slate-800"></div> </div> <div class="relative flex justify-center text-[10px] uppercase font-extrabold tracking-widest text-slate-500"> <span class="bg-slate-900 px-3">o usa tus credenciales</span> </div> </div> <!-- Form --> <form id="login-form" class="flex flex-col gap-5"> <div class="flex flex-col gap-2"> <label for="email" class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico</label> <input type="email" name="email" id="email" required placeholder="admin@correo.com" class="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-700 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all text-sm"> </div> <div class="flex flex-col gap-2"> <label for="password" class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contraseña</label> <input type="password" name="password" id="password" required placeholder="******" class="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-700 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all text-sm"> </div> <button type="submit" id="submit-btn" class="w-full py-4 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-center transition-all duration-200 active:scale-95 shadow-md uppercase tracking-wider text-xs">
Acceder al Panel
</button> </form> </div>  </body> </html>`;
}, "C:/Users/javie/Documents/Proyectos/flexformfitness/src/pages/admin/login.astro", void 0);
const $$file = "C:/Users/javie/Documents/Proyectos/flexformfitness/src/pages/admin/login.astro";
const $$url = "/admin/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
