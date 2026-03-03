# Favicon & PWA Configuration

## Overview
This project uses a production-ready favicon and PWA manifest setup for Kairos Finance.

## Files Involved

### 1. **frontend/public/kairo-logo.png**
- **Location**: `/frontend/public/kairo-logo.png`
- **Format**: PNG (192x192px minimum, supports up to 512x512px)
- **Source**: Located in `/docs/logo.jpeg`, copied to public during setup
- **Used for**: Browser favicon, app icon, PWA installation

### 2. **frontend/public/manifest.json**
- **Location**: `/frontend/public/manifest.json`
- **Purpose**: PWA Web App Manifest for app installation
- **Features**:
  - Standalone display mode
  - Dark theme colors matching Kairos branding
  - Multiple icon sizes (192x192, 512x512)
  - Maskable icon support for adaptive icons
  - Screenshot for app store display

### 3. **frontend/app/layout.tsx**
- **Metadata configuration**:
  ```tsx
  export const metadata: Metadata = {
    title: "Kairos Finance",
    description: "AI-Powered Yield Optimization on Base",
    icons: {
      icon: "/kairo-logo.png",           // Primary favicon
      shortcut: "/kairo-logo.png",       // Shortcut favicon
      apple: "/kairo-logo.png",          // iOS Safari
    },
    manifest: "/manifest.json",          // PWA manifest
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",  // iOS status bar style
    },
  };
  ```

## How It Works

### Browser Favicon Display
1. Next.js automatically generates appropriate `<link rel="icon">` tags in the HTML head
2. Different browsers/devices use different icon sizes:
   - **Browser tabs**: 16x16px to 32x32px
   - **Bookmarks**: 16x16px
   - **Address bar**: 16x16px
3. The PNG format works across all modern browsers

### PWA Installation
1. Users can install the app on mobile/desktop
2. The manifest.json provides:
   - App name and short name
   - Display mode (standalone = full screen)
   - Theme and background colors
   - Multiple icon sizes for different devices
   - Maskable icon support for device-specific shapes

### Development & Production
- **Development**: Works at `http://localhost:3000/`
- **Production**: Works on Vercel at `https://kairo-finance.vercel.app/`
- **No special configuration needed** - Next.js handles it automatically

## Favicon Format Support

| Format | Support | Notes |
|--------|---------|-------|
| PNG | ✅ All browsers | Currently used (recommended) |
| ICO | ✅ All browsers | Legacy, can be added if needed |
| SVG | ✅ Modern browsers | More scalable, ~5KB file size |
| JPG | ✅ All browsers | Not recommended (lossy) |

## Adding .ico Alternative (Optional)

If you want to add favicon.ico for maximum compatibility:

```bash
# Convert PNG to ICO (using ImageMagick)
convert frontend/public/kairo-logo.png -define icon:auto-resize=256,128,96,64,48,32,16 frontend/public/favicon.ico
```

Then update layout.tsx:
```tsx
icons: {
  icon: "/favicon.ico",
  shortcut: "/favicon.ico",
  apple: "/kairo-logo.png",
}
```

## Customization

### Change Colors in manifest.json
```json
{
  "background_color": "#0f172a",  // Page background
  "theme_color": "#1e293b"        // Browser chrome
}
```

### Add Apple Splash Screens (Extended PWA)
```tsx
appleWebApp: {
  capable: true,
  statusBarStyle: "black-translucent",
  startupImages: [
    {
      url: "/splash-180.png",
      media: "(device-width: 414px) and (device-height: 896px)"
    }
  ]
}
```

## Testing

### Browser DevTools
1. Chrome: **Settings → Icons → Check Network tab for favicon request**
2. Firefox: **Inspect → Network → Filter by `kairo-logo.png`**
3. Safari: **Develop → Empty Cache → Reload page**

### Hard Refresh Cache
```bash
macOS: Cmd + Shift + R
Windows: Ctrl + Shift + F5
Linux: Ctrl + Shift + F5
```

### PWA Installation
1. Open site on Mobile/Desktop
2. Browser should show "Install app" prompt
3. Check manifest.json in DevTools → Application → Manifest

### Vercel Deployment
- Icons are automatically served from `/public` directory
- No additional configuration needed
- CDN will cache favicon for optimal performance

## Clean Repository State
- ✅ No legacy `<link rel="icon">` tags in HTML
- ✅ No favicon.ico conflicts
- ✅ Single source of truth: `kairo-logo.png`
- ✅ PWA properly configured
- ✅ Production-ready for both dev and Vercel

## Rollback (if needed)
If you need to revert favicon setup:

```bash
# Option 1: Minimal setup (just icon)
# Remove manifest reference from layout.tsx
# Keep just:
icons: {
  icon: "/kairo-logo.png",
}

# Option 2: Legacy favicon.ico approach
# Add favicon.ico to /public
# Update layout.tsx to point to it
```

## Resources
- [Next.js Metadata - Icons Documentation](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#icons)
- [MDN - Favicon Guide](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/The_head_metadata_in_HTML#adding_custom_favicons)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [PWA Manifest Generator](https://www.pwabuilder.com/)
