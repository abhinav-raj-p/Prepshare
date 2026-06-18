# Architecture: Session Management + Full Logout + Payment Routing

## Clarified Understanding

Your design is correct and elegant:
- `currentDeviceId` in Firestore is the **authoritative ID of the currently active device**
- It is **only ever written during login** — never during logout
- When Device B logs in → Firestore `currentDeviceId` = Device B's ID → Device A's `onSnapshot` fires → Device A is terminated automatically ✓
- No new logout method needed — one `logout()` handles everything

---

## What Needs to Change: 4 Surgical Fixes

---

### Fix 1 — `logout()`: Add Firestore Sync Before Signing Out

**Current behavior**: `logout()` only signs out from Firebase Auth and clears `localStorage`. It does NOT push any locally-cached user data back to Firestore before leaving.

**Required behavior**: Before signing out, sync the current user's profile data from `mca_current_user` in localStorage to the `users/{uid}` document in Firestore. This ensures anything the user did during their session (name updates, profile changes etc.) is permanently saved.

**Rule**: Do NOT sync `currentDeviceId` — it belongs to whoever logged in last and is not ours to overwrite on logout.

```
logout() steps:
  1. Stop deviceSessionListener (existing)
  2. Read mca_current_user from localStorage
  3. If user exists AND useFallback = false AND db available:
       → Write to Firestore users/{uid}: { name, mobile, email, updatedAt }
       → SKIP: currentDeviceId (not our field to touch)
  4. auth.signOut() (existing)
  5. localStorage.removeItem('mca_current_user') (existing)
```

---

### Fix 2 — `startDeviceSessionCheck`: Two problems

**Problem A — Fires on wrong pages**  
`getCurrentUser()` is called everywhere including `index.html`, `upi-payment.html`, etc. Every call starts the `onSnapshot` listener. If `currentDeviceId` doesn't match (common in testing where device IDs diverge), it incorrectly renders "Session Terminated" on the homepage.

**Fix**: Add a guard — only start the listener when on a **protected page**:
```javascript
const PROTECTED = ['student-dashboard.html', 'course-workspace.html', 'mocktest.html'];
if (!PROTECTED.some(p => window.location.pathname.includes(p))) return;
```

**Problem B — The button label and redirect method**  
The overlay button says "Return to Home" and uses `window.location.href`. Since the button already calls `window.FirebaseService.logout()`, the label "Return to Home" is misleading — it IS a logout. And `location.href` adds to browser history, enabling the back button to return to the terminated session page.

**Fix**: 
- Rename the button label to **"Logout"** (consistent with the rest of the app)
- Use `window.location.replace("index.html")` (no browser history entry)
- Both the real Firestore path AND the mock fallback path get this fix

---

### Fix 3 — Routing `catch` blocks → `upi-payment.html`

**`components.js` `finalizeRedirect`** and **`index.html` `checkAuth`** both have catch blocks that currently default to `student-dashboard.html`. When Firestore collections are missing (testing phase), queries fail → catch fires → user lands on dashboard → dashboard guard also fails → stuck at "Verifying Access" forever.

**Fix**: Both catch blocks redirect to `upi-payment.html`.
- Cannot verify enrollment = cannot grant access = send to payment page
- This is the logically correct behavior

---

### Fix 4 — `student-dashboard.js` catch block

**Current**: On any `initDashboard` error, the catch mutates the shield HTML to show "System Error / Reload Page". This hides the real problem and keeps the user stuck.

**Fix**: On any error inside `initDashboard`:
1. Remove the shield immediately (never leave it on screen)
2. Redirect to `upi-payment.html` — this is the safest recovery path

---

## Complete Session Flow (confirmed)

```
Normal Logout (user clicks Logout):
  logout() → sync profile data to Firestore (except deviceId) → auth.signOut() → clear localStorage → index.html

Forced Logout (Device A evicted by Device B):
  Device B login → sets currentDeviceId = Device B's ID in Firestore
  Device A's onSnapshot fires → sees mismatch → "Session Terminated" overlay appears
  User clicks "Logout" button on overlay
  → calls same logout() → syncs data → auth.signOut() → clear localStorage → location.replace("index.html")
  NOTE: currentDeviceId in Firestore is NOT touched. Device B still owns it. ✓

Next time Device A tries to log in:
  loginEmail() → sets currentDeviceId = Device A's new ID ← ONLY place it gets written
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `firebase-service.js` | `logout()`: add Firestore profile sync before sign-out (skip `currentDeviceId`) |
| `firebase-service.js` | `startDeviceSessionCheck`: add protected-pages guard; rename button to "Logout"; use `location.replace` |
| `components.js` | `finalizeRedirect` catch: `upi-payment.html` instead of `student-dashboard.html` |
| `index.html` | `checkAuth` catch: `upi-payment.html` instead of `student-dashboard.html` |
| `student-dashboard.js` | `initDashboard` catch: remove shield + `location.replace("upi-payment.html")` |

**Total: 4 files, 5 precise edits. No other logic is touched.**

## User Review Required

> [!IMPORTANT]
> Confirm: The `logout()` Firestore sync should include which fields? I propose: `name`, `mobile`, `email`, `updatedAt`. Should anything else from the user profile in localStorage be synced back to Firestore on logout?
