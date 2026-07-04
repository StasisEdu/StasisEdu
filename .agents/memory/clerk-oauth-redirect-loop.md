---
name: Clerk OAuth redirect loop (vanilla JS)
description: Fix for Clerk Google OAuth looping back to login instead of entering the app, in a non-React/vanilla-JS integration.
---

Symptom: after Google account selection, Clerk redirects back to the app's own URL (no dedicated `/sso-callback` route) with `__clerk_status`/`__clerk_created_session` params, but the app falls back to showing the login/splash screen instead of entering the signed-in app.

Root cause pattern: `clerk.load()` can process/clean up OAuth-related query params internally, so checking `window.location.search` for `__clerk_status` *after* `await clerk.load()` is unreliable. Also, relying on generic downstream "is user logged in" branching (e.g. a splash-screen function with several conditional paths) to notice the new session is fragile — it's easy for one of those paths to not fire correctly right after a redirect.

**Fix:**
1. Snapshot `new URLSearchParams(window.location.search)` and check for the Clerk OAuth marker params *before* calling `await clerk.load()`.
2. After `load()` resolves, if the pre-load snapshot showed an OAuth return, call `await clerk.handleRedirectCallback()`, strip the params from the URL via `history.replaceState`, then call the app's main "render the signed-in app" entry point *directly* — don't just fall through to generic post-login detection logic.
3. Guard the normal splash/login flow with a flag so it doesn't run a second, redundant init pass after the direct call.

**Why:** Clerk-js's internal cleanup timing around OAuth callback params is undocumented and can race with app-level checks; direct control of the render call removes the dependency on Clerk's internal state being reflected correctly in a generic branch.

**How to apply:** Any vanilla-JS (non-React) Clerk integration handling OAuth redirects back to the same page (no separate `/sso-callback` route).
