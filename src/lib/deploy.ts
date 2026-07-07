/**
 * Trigger an automatic redeploy/rebuild on Vercel via Deploy Hook
 * This ensures that changes made to the database (Firestore) in the admin panel
 * are propagated to the pre-rendered static site pages in production.
 */
export async function triggerRebuild() {
  const hookUrl = import.meta.env.VERCEL_DEPLOY_HOOK || process.env.VERCEL_DEPLOY_HOOK;
  
  if (!hookUrl) {
    console.log('[Deploy Helper] VERCEL_DEPLOY_HOOK is not defined. Skipping automatic rebuild.');
    return;
  }

  try {
    console.log('[Deploy Helper] Triggering Vercel rebuild...');
    const response = await fetch(hookUrl, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log('[Deploy Helper] Rebuild triggered successfully on Vercel.', data);
    } else {
      console.error('[Deploy Helper] Failed to trigger rebuild on Vercel:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('[Deploy Helper] Network error attempting to trigger rebuild on Vercel:', error);
  }
}
