import './chunks/firebase_CqeBG1kq.mjs';
import { d as defineMiddleware, g as getOriginPathname, s as sequence } from './chunks/render-context_91tObHAL.mjs';
import admin from 'firebase-admin';
import 'es-module-lexer';
import { a as ACTION_QUERY_PARAMS, s as serializeActionResult } from './chunks/shared_CzD7f8ex.mjs';
import 'cookie';
import { yellow } from 'kleur/colors';
import { h as hasContentType, f as formContentTypes, A as ACTION_API_CONTEXT_SYMBOL } from './chunks/utils_Cwo9_uli.mjs';
import { getAction } from './chunks/get-action_DUmmLij1.mjs';

const onRequest$2 = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  context.locals.user = null;
  const path = url.pathname;
  const isSSR = path.startsWith("/admin") || path.startsWith("/carrito") || path.startsWith("/api") || path.startsWith("/_actions");
  const sessionCookie = isSSR ? context.cookies.get("session_token")?.value : void 0;
  if (sessionCookie) {
    try {
      const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
      context.locals.user = {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        name: decodedClaims.name || decodedClaims.email?.split("@")[0] || "Usuario",
        picture: decodedClaims.picture || void 0
      };
    } catch (error) {
      {
        console.warn("Session verification failed, deleting cookie.");
        context.cookies.delete("session_token", { path: "/" });
      }
    }
  }
  if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login" && url.pathname !== "/admin/logout") {
    const user = context.locals.user;
    if (!user || !user.email) {
      console.warn(`Unauthorized access attempt to ${url.pathname} from IP: ${context.clientAddress}: No active session`);
      return context.redirect("/admin/login", 302);
    }
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
        console.error("Error verifying admin role in middleware:", err);
      }
    }
    if (!isAdmin) {
      console.warn(`Unauthorized access attempt to ${url.pathname} from IP: ${context.clientAddress} by non-admin: ${user.email}`);
      return context.redirect("/admin/login?error=unauthorized", 302);
    }
  }
  return next();
});

const onRequest$1 = defineMiddleware(async (context, next) => {
  if (context._isPrerendered) {
    if (context.request.method === "POST") {
      console.warn(
        yellow("[astro:actions]"),
        "POST requests should not be sent to prerendered pages. If you're using Actions, disable prerendering with `export const prerender = false`."
      );
    }
    return next();
  }
  const locals = context.locals;
  if (locals._actionPayload) return next();
  const actionPayload = context.cookies.get(ACTION_QUERY_PARAMS.actionPayload)?.json();
  if (actionPayload) {
    if (!isActionPayload(actionPayload)) {
      throw new Error("Internal: Invalid action payload in cookie.");
    }
    return renderResult({ context, next, ...actionPayload });
  }
  const actionName = context.url.searchParams.get(ACTION_QUERY_PARAMS.actionName);
  if (context.request.method === "POST" && actionName) {
    return handlePost({ context, next, actionName });
  }
  return next();
});
async function renderResult({
  context,
  next,
  actionResult,
  actionName
}) {
  const locals = context.locals;
  locals._actionPayload = { actionResult, actionName };
  const response = await next();
  context.cookies.delete(ACTION_QUERY_PARAMS.actionPayload);
  if (actionResult.type === "error") {
    return new Response(response.body, {
      status: actionResult.status,
      statusText: actionResult.type,
      headers: response.headers
    });
  }
  return response;
}
async function handlePost({
  context,
  next,
  actionName
}) {
  const { request } = context;
  const baseAction = await getAction(actionName);
  const contentType = request.headers.get("content-type");
  let formData;
  if (contentType && hasContentType(contentType, formContentTypes)) {
    formData = await request.clone().formData();
  }
  const { getActionResult, callAction, props, redirect, ...actionAPIContext } = context;
  Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
  const action = baseAction.bind(actionAPIContext);
  const actionResult = await action(formData);
  if (context.url.searchParams.get(ACTION_QUERY_PARAMS.actionRedirect) === "false") {
    return renderResult({
      context,
      next,
      actionName,
      actionResult: serializeActionResult(actionResult)
    });
  }
  return redirectWithResult({ context, actionName, actionResult });
}
async function redirectWithResult({
  context,
  actionName,
  actionResult
}) {
  context.cookies.set(ACTION_QUERY_PARAMS.actionPayload, {
    actionName,
    actionResult: serializeActionResult(actionResult)
  });
  if (actionResult.error) {
    const referer2 = context.request.headers.get("Referer");
    if (!referer2) {
      throw new Error("Internal: Referer unexpectedly missing from Action POST request.");
    }
    return context.redirect(referer2);
  }
  const referer = getOriginPathname(context.request);
  if (referer) {
    return context.redirect(referer);
  }
  return context.redirect(context.url.pathname);
}
function isActionPayload(json) {
  if (typeof json !== "object" || json == null) return false;
  if (!("actionResult" in json) || typeof json.actionResult !== "object") return false;
  if (!("actionName" in json) || typeof json.actionName !== "string") return false;
  return true;
}

const onRequest = sequence(
	
	onRequest$2,
	onRequest$1
);

export { onRequest };
