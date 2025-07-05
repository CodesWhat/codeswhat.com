# Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/codeswhat/website)

## Manual Deployment

1. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

## Environment Variables

Add these in your Vercel dashboard under Settings → Environment Variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_NAME` | Your site name | `CodesWhat?` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Site description for SEO | `Modern software consultancy...` |
| `NEXT_PUBLIC_SITE_URL` | Your production URL | `https://codeswhat.com` |
| `EMAILOCTOPUS_API_KEY` | EmailOctopus API key | `abc123...` |
| `EMAILOCTOPUS_LIST_ID` | EmailOctopus list ID | `123e4567-e89b...` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics | `auto-generated` |

## Domain Configuration

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your domain: `codeswhat.com`
4. Follow the DNS configuration instructions

## Build Settings

The `vercel.json` file includes:
- ✅ Security headers
- ✅ API route configuration  
- ✅ Function timeouts
- ✅ Caching rules

## Features Configured

- **Security Headers**: XSS protection, frame options, content type sniffing prevention
- **API Caching**: Disabled for `/api/*` routes
- **Function Duration**: 10 seconds max for email signup
- **Sitemap**: Rewrite rule ready for dynamic sitemap

## Monitoring

1. Enable Vercel Analytics (free tier available)
2. Monitor Core Web Vitals
3. Set up alerts for function errors

## Troubleshooting

### Environment Variables Not Working
- Ensure variables are added to the correct environment (Production/Preview/Development)
- Redeploy after adding variables
- Check for typos in variable names

### Build Failures
- Check build logs in Vercel dashboard
- Ensure Node.js version matches locally (20.9.0+)
- Verify all dependencies are in package.json

### Email Signup Not Working
- Verify EmailOctopus credentials
- Check function logs in Vercel dashboard
- Ensure API routes are correctly configured 