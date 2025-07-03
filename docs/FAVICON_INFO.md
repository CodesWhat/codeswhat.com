# Favicon Information

## Current Setup
- `favicon.ico` - Main browser tab icon
- `apple-touch-icon.png` - iOS home screen icon
- `icon-192x192.png` - Android/PWA small icon
- `icon-512x512.png` - Android/PWA large icon

## Dark Mode Behavior
**Important**: Favicons do NOT automatically invert colors for dark mode. This is a browser limitation.

### Solutions for Dark Mode:
1. **Use a design that works in both modes** (current approach)
   - Green accent color is visible on both light and dark backgrounds
   - Black outline provides contrast

2. **SVG favicon with CSS** (modern browsers only)
   ```html
   <link rel="icon" type="image/svg+xml" href="/favicon.svg">
   ```
   SVG favicons can use CSS media queries for dark mode

3. **JavaScript solution** (not recommended)
   - Dynamically change favicon based on color scheme
   - Poor performance and compatibility

## Regenerating Favicons
If you need to regenerate favicons from the green logo:
1. Use the green logo at `/public/logos/codeswhat-logo-green.png`
2. Generate sizes: 16x16, 32x32, 48x48 for ICO
3. Ensure transparent background for better appearance

## Color Considerations
- The green (#C4FF00) provides good contrast on both light and dark browser tabs
- Avoid pure white or black favicons as they disappear on matching backgrounds
- Current favicon should be visible in all contexts 