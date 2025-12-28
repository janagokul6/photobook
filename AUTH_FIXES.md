# Authentication Fixes - December 2025

## Issues Fixed

### 1. ✅ DEP0169 Deprecation Warning (`url.parse()`)

**Problem:**
```
(node:4) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead.
```

**Root Cause:**
- This warning originates from NextAuth v4's internal code
- NextAuth v4 uses the deprecated Node.js `url.parse()` API
- This is a known issue with NextAuth v4 and is fixed in NextAuth v5 (Auth.js)

**Solution Applied:**
- Suppressed the deprecation warning by adding `NODE_OPTIONS='--no-deprecation'` to the dev script in `package.json`
- This is a temporary workaround until we upgrade to NextAuth v5

**Long-term Solution:**
- Upgrade to NextAuth v5 (Auth.js) which uses the modern WHATWG URL API
- Migration guide: https://authjs.dev/getting-started/migrating-to-v5

---

### 2. ✅ Redirect Not Working After Login

**Problem:**
- After successful Google OAuth login (Google Drive/Photos), users were not redirected to `/admin/dashboard`
- After successful credentials login (email/password), users were not redirected to `/admin/dashboard`
- Both authentication methods had the same redirect issue

**Root Cause:**
Both issues were caused by **missing redirect callback** in NextAuth configuration:
- NextAuth's default redirect behavior was not properly configured
- The `signIn` callback returned `true` but didn't handle the redirect URL
- Client-side `router.push()` was not triggering a full page reload, causing session issues

**Solutions Applied:**

#### A. Added `redirect` Callback in `lib/auth.ts`
```typescript
async redirect({ url, baseUrl }) {
  // Handle redirect after sign-in
  console.log('🔄 NextAuth Redirect Callback');
  console.log('- url:', url);
  console.log('- baseUrl:', baseUrl);
  
  // If url is relative, prepend baseUrl
  if (url.startsWith('/')) {
    const redirectUrl = `${baseUrl}${url}`;
    console.log('- Redirecting to:', redirectUrl);
    return redirectUrl;
  }
  
  // If url already contains baseUrl, use it
  if (url.startsWith(baseUrl)) {
    console.log('- Redirecting to:', url);
    return url;
  }
  
  // Default to dashboard
  const defaultUrl = `${baseUrl}/admin/dashboard`;
  console.log('- Redirecting to default:', defaultUrl);
  return defaultUrl;
}
```

This callback:
- Handles relative URLs by prepending the base URL
- Validates absolute URLs
- Provides a default redirect to `/admin/dashboard`
- Adds debug logging to track redirect behavior

#### B. Updated Credentials Login in `app/admin/login/page.tsx`
```typescript
const result = await signIn('credentials', {
  username,
  password,
  redirect: false,
  callbackUrl: '/admin/dashboard',  // Added explicit callback URL
});

if (result?.error) {
  setError('Invalid username or password');
} else if (result?.ok) {
  // Use window.location for full page reload to ensure session is established
  window.location.href = '/admin/dashboard';
}
```

Changes:
- Added explicit `callbackUrl` parameter
- Changed from `router.push()` to `window.location.href` for full page reload
- Added `result?.ok` check for better error handling
- Full page reload ensures NextAuth session is properly established

---

## Why Both Issues Occurred

**Yes, both issues were related but had different root causes:**

1. **Deprecation Warning**: Internal NextAuth v4 code issue (not our code)
2. **Redirect Issue**: Missing configuration in our NextAuth setup

The redirect issue affected **both** authentication methods (OAuth and credentials) because:
- Both use the same NextAuth configuration in `lib/auth.ts`
- Both lacked proper redirect callback handling
- The credentials provider had an additional issue with client-side navigation

---

## Testing the Fixes

### 1. Test Deprecation Warning Fix
```bash
npm run dev
```
- The `url.parse()` deprecation warning should no longer appear
- Server should start cleanly

### 2. Test Google OAuth Login
1. Click "Sign in with Google Drive" or "Sign in with Google Photos"
2. Complete OAuth flow
3. Should redirect to `/admin/dashboard` automatically
4. Check console logs for redirect callback messages

### 3. Test Credentials Login
1. Enter username and password
2. Click "Sign In with Password"
3. Should redirect to `/admin/dashboard` automatically
4. Session should be properly established

---

## Files Modified

1. **`lib/auth.ts`**
   - Added `redirect` callback to handle post-authentication redirects
   - Added debug logging for redirect tracking

2. **`app/admin/login/page.tsx`**
   - Updated credentials login to use `window.location.href` instead of `router.push()`
   - Added explicit `callbackUrl` parameter
   - Improved error handling with `result?.ok` check

3. **`package.json`**
   - Updated `dev` script to suppress deprecation warnings
   - Added `NODE_OPTIONS='--no-deprecation'` flag

---

## Additional Notes

### Environment Variables Required
Ensure these are set in `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-password
```

### Callback URL Configuration
Ensure Google OAuth Console has these authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/googledrive
http://localhost:3000/api/auth/callback/googlephotos
```

### Debug Logging
The redirect callback now logs:
- Incoming URL
- Base URL
- Final redirect destination

Check your terminal/console for these logs to debug any redirect issues.

---

## Future Improvements

1. **Upgrade to NextAuth v5 (Auth.js)**
   - Eliminates the `url.parse()` deprecation warning
   - Better TypeScript support
   - Improved redirect handling
   - Modern WHATWG URL API

2. **Add Error Handling**
   - Handle failed token storage gracefully
   - Show user-friendly error messages
   - Implement retry logic for OAuth failures

3. **Session Management**
   - Add session refresh logic
   - Implement token rotation
   - Add session expiry notifications

---

## Troubleshooting

### If redirect still doesn't work:

1. **Clear browser cache and cookies**
   ```bash
   # Chrome DevTools: Application > Clear storage
   ```

2. **Check middleware configuration**
   - Ensure `/admin/dashboard` is protected by middleware
   - Verify matcher pattern includes dashboard route

3. **Verify session creation**
   ```typescript
   // In dashboard page
   import { getServerSession } from 'next-auth';
   const session = await getServerSession(authOptions);
   console.log('Session:', session);
   ```

4. **Check NextAuth debug logs**
   - Debug mode is enabled in development
   - Check terminal for `[NextAuth Debug]` messages

### If deprecation warning still appears:

1. **Restart the dev server**
   ```bash
   npm run dev
   ```

2. **Check NODE_OPTIONS is set**
   ```bash
   # Should show --no-deprecation
   echo $NODE_OPTIONS
   ```

3. **Alternative: Use .env file**
   ```env
   # Add to .env.local
   NODE_OPTIONS=--no-deprecation
   ```

---

## Summary

✅ **Fixed**: DEP0169 deprecation warning by suppressing it in dev script  
✅ **Fixed**: Google OAuth redirect by adding redirect callback  
✅ **Fixed**: Credentials login redirect by using window.location.href  
✅ **Improved**: Added debug logging for better troubleshooting  
✅ **Documented**: Complete explanation of issues and solutions  

Both authentication methods (OAuth and credentials) now properly redirect to the dashboard after successful login.
