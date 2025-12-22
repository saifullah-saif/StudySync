# Production Authentication Fix

## Problem Analysis

### Error Details
- **URL**: `https://studysync-server-ouba.onrender.com/api/auth/validate-session`
- **Status**: 401 Unauthorized
- **Environment**: Production (Vercel Client ↔ Render Server)

### Root Causes Identified

1. **URL Configuration Mismatch**
   - Config files pointed to: `https://study-sync-server-sigma.vercel.app`
   - Actual server URL: `https://studysync-server-ouba.onrender.com`

2. **Cross-Domain Cookie Issues**
   - Client on Vercel: `study-sync-client.vercel.app`
   - Server on Render: `studysync-server-ouba.onrender.com`
   - HTTP-only cookies require proper `sameSite` and `secure` settings for cross-origin requests

3. **CORS Configuration**
   - Server CORS didn't include the actual Render server URL

## Changes Made

### 1. Client Configuration (`client/.env.local`)
```env
NEXT_PUBLIC_PRODUCTION_API_URL=https://studysync-server-ouba.onrender.com/api
NEXT_PUBLIC_PRODUCTION_SERVER_URL=https://studysync-server-ouba.onrender.com
```

### 2. Server Configuration (`server/.env`)
```env
PRODUCTION_SERVER_URL="https://studysync-server-ouba.onrender.com"
```

### 3. CORS Allowed Origins (`server/server.js`)
Updated to include:
- `https://studysync-server-ouba.onrender.com`
- `https://studysync-server-ouba.onrender.com/`
- `https://studysync-server-ouba.onrender.com/api`

### 4. Cookie Settings (`server/controller/authController.js`)
```javascript
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Changed "None" to "none"
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

**Key Changes**:
- `sameSite: "none"` (lowercase) for cross-origin cookies in production
- `secure: true` in production (required when sameSite=none)
- Proper cookie clearing with matching settings

## Deployment Steps

### 1. Update Server Environment Variables on Render
Go to your Render dashboard and update:
```env
PRODUCTION_CLIENT_URL=https://study-sync-client.vercel.app
PRODUCTION_SERVER_URL=https://studysync-server-ouba.onrender.com
NODE_ENV=production
```

### 2. Update Client Environment Variables on Vercel
Go to your Vercel dashboard and update:
```env
NEXT_PUBLIC_PRODUCTION_API_URL=https://studysync-server-ouba.onrender.com/api
NEXT_PUBLIC_PRODUCTION_SERVER_URL=https://studysync-server-ouba.onrender.com
NODE_ENV=production
```

### 3. Redeploy Both Applications
- **Server (Render)**: Push changes to trigger auto-deploy or manually redeploy
- **Client (Vercel)**: Push changes to trigger auto-deploy or manually redeploy

## Testing Checklist

After deployment, test these scenarios:

- [ ] User registration works
- [ ] User login works and sets cookie
- [ ] Session validation succeeds (no 401 errors)
- [ ] Authenticated routes work
- [ ] User logout works and clears cookie
- [ ] Page refresh maintains authentication

## Technical Notes

### Why sameSite="none" is Required
When client and server are on different domains:
- Browser treats requests as "cross-site"
- Default `sameSite="lax"` blocks cookies on cross-site POST requests
- `sameSite="none"` explicitly allows cross-site cookies
- **Must** be paired with `secure=true` (HTTPS only)

### Cookie Security
Current setup ensures:
- ✅ `httpOnly`: Prevents JavaScript access (XSS protection)
- ✅ `secure`: HTTPS only in production
- ✅ `sameSite="none"`: Allows cross-origin (Vercel ↔ Render)
- ✅ 7-day expiration

### Alternative Solution (If Issues Persist)
If cross-domain cookies still don't work:

**Option A**: Move to Token-Based Auth
```javascript
// Store token in localStorage instead of cookies
// Send in Authorization header: Bearer <token>
```

**Option B**: Deploy Both on Same Platform
- Deploy both client and server on Vercel
- Or both on Render
- Use same parent domain (e.g., subdomain.yourdomain.com)

## Troubleshooting

### If 401 Errors Continue

1. **Check Browser Console**
   ```
   Look for: "Cookie not sent" or "SameSite" warnings
   ```

2. **Verify Cookie is Set**
   ```
   Browser DevTools → Application → Cookies
   Should see "token" cookie with domain and SameSite=None
   ```

3. **Check Network Tab**
   ```
   Request Headers should include: Cookie: token=...
   ```

4. **Verify CORS Headers**
   ```
   Response should include:
   - Access-Control-Allow-Origin: https://study-sync-client.vercel.app
   - Access-Control-Allow-Credentials: true
   ```

### Common Issues

**Issue**: Cookie not sent in requests
**Solution**: Ensure `credentials: 'include'` in fetch/axios config

**Issue**: CORS error
**Solution**: Verify server allows client origin and credentials

**Issue**: Cookie rejected
**Solution**: Check `secure=true` and `sameSite="none"` in production

## Contact
If issues persist after following these steps, check:
1. Server logs on Render
2. Browser console errors
3. Network tab for request/response details
