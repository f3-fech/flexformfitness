import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_CRK5ZQnC.mjs';
import { manifest } from './manifest_wTNniAyb.mjs';

const _page0 = () => import('./pages/_actions/_---path_.astro.mjs');
const _page1 = () => import('./pages/_image.astro.mjs');
const _page2 = () => import('./pages/admin/dashboard.astro.mjs');
const _page3 = () => import('./pages/admin/login.astro.mjs');
const _page4 = () => import('./pages/admin/logout.astro.mjs');
const _page5 = () => import('./pages/api/auth/logout.astro.mjs');
const _page6 = () => import('./pages/api/auth/session.astro.mjs');
const _page7 = () => import('./pages/api/checkout.astro.mjs');
const _page8 = () => import('./pages/api/webhooks/stripe.astro.mjs');
const _page9 = () => import('./pages/carrito.astro.mjs');
const _page10 = () => import('./pages/checkout/success.astro.mjs');
const _page11 = () => import('./pages/colecciones/_slug_.astro.mjs');
const _page12 = () => import('./pages/login.astro.mjs');
const _page13 = () => import('./pages/productos/_slug_.astro.mjs');
const _page14 = () => import('./pages/products.json.astro.mjs');
const _page15 = () => import('./pages/registro.astro.mjs');
const _page16 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/actions/runtime/route.js", _page0],
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page1],
    ["src/pages/admin/dashboard.astro", _page2],
    ["src/pages/admin/login.astro", _page3],
    ["src/pages/admin/logout.astro", _page4],
    ["src/pages/api/auth/logout.ts", _page5],
    ["src/pages/api/auth/session.ts", _page6],
    ["src/pages/api/checkout.ts", _page7],
    ["src/pages/api/webhooks/stripe.ts", _page8],
    ["src/pages/carrito.astro", _page9],
    ["src/pages/checkout/success.astro", _page10],
    ["src/pages/colecciones/[slug].astro", _page11],
    ["src/pages/login.astro", _page12],
    ["src/pages/productos/[slug].astro", _page13],
    ["src/pages/products.json.ts", _page14],
    ["src/pages/registro.astro", _page15],
    ["src/pages/index.astro", _page16]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "b9618d6f-783b-4814-bb44-71824a5784e8",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
