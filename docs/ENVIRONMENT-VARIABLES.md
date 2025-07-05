# Environment Variables Management

## Required Variables

Your project requires the following environment variables:

### Email Service (EmailOctopus)
- `EMAILOCTOPUS_API_KEY` - Your EmailOctopus API key
- `EMAILOCTOPUS_LIST_ID` - The ID of your EmailOctopus list

### Site Configuration (Optional)
- `NEXT_PUBLIC_SITE_NAME` - Site name (default: "CodesWhat?")
- `NEXT_PUBLIC_SITE_DESCRIPTION` - Site description
- `NEXT_PUBLIC_SITE_URL` - Your production URL

## Setting Up Variables

### Option 1: Vercel Dashboard (Recommended) ✅

1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `EMAILOCTOPUS_API_KEY`)
   - **Value**: Your actual value
   - **Environment**: Select where it applies:
     - ✅ Production
     - ✅ Preview 
     - ✅ Development (optional)
4. Click **Save**

**Pros:**
- Most secure - values never exposed in code
- Easy to update without redeploying
- Different values per environment
- Vercel encrypts all values

### Option 2: GitHub Secrets (For CI/CD) 🔐

GitHub Secrets are useful if you're running GitHub Actions, but **NOT needed for Vercel deployments**.

If you need them for other workflows:
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secrets with `VERCEL_` prefix

### Option 3: Local Development 💻

Create a `.env.local` file in the `frontend` directory:

```bash
# frontend/.env.local
EMAILOCTOPUS_API_KEY=your_actual_api_key
EMAILOCTOPUS_LIST_ID=your_actual_list_id
NEXT_PUBLIC_SITE_NAME=CodesWhat?
NEXT_PUBLIC_SITE_DESCRIPTION=Your description
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Note:** Never commit `.env.local` to git!

## Why Vercel Doesn't Ask Automatically

Vercel only prompts for environment variables if:
1. Your build fails due to missing variables
2. You have a `.env.example` file (we just created one!)

## Getting Your EmailOctopus Credentials

1. Sign up at [EmailOctopus](https://emailoctopus.com)
2. Go to **Account** → **API Keys**
3. Create a new API key
4. Go to **Lists** → Create/Select a list
5. Copy the List ID from the URL or list settings

## Quick Setup Commands

```bash
# Check what variables are needed
grep -r "process.env" frontend/app --include="*.ts" --include="*.tsx"

# Test locally with .env.local
cd frontend
npm run dev

# Deploy to Vercel (after setting variables in dashboard)
vercel --prod
```

## Security Best Practices

1. **Never commit secrets** to git
2. **Use different values** for dev/staging/production
3. **Rotate API keys** regularly
4. **Limit API key permissions** when possible
5. **Monitor usage** in EmailOctopus dashboard

## Vercel Auto-Provided Variables

Vercel automatically provides:
- `VERCEL_URL` - Your deployment URL
- `VERCEL_ENV` - Current environment
- `NODE_ENV` - Node environment
- `VERCEL_REGION` - Deployment region

You don't need to set these manually. 