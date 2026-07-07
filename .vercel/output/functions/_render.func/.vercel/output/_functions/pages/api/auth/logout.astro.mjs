export { renderers } from '../../../renderers.mjs';

const prerender = false;
const POST = async ({ cookies }) => {
  cookies.delete("session_token", {
    path: "/"
  });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
const GET = async ({ cookies, redirect }) => {
  cookies.delete("session_token", {
    path: "/"
  });
  return redirect("/", 302);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
