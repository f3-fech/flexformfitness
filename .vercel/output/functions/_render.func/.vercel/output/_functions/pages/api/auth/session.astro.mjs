import '../../../chunks/firebase_CqeBG1kq.mjs';
import admin from 'firebase-admin';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const POST = async ({ request, cookies }) => {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return new Response(JSON.stringify({ error: "Missing ID Token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const expiresIn = 5 * 24 * 60 * 60 * 1e3;
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    cookies.set("session_token", sessionCookie, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 5 * 24 * 60 * 60
      // 5 days in seconds
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: error.message }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
