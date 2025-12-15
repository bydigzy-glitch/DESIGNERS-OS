---
description: Deploy DESIGNERS-OS to Vercel
---

# Deployment Workflow for DESIGNERS-OS

This workflow describes how to deploy the DESIGNERS-OS application to Vercel.

## Prerequisites

- Vercel CLI installed globally: `npm install -g vercel`
- Git repository connected to Vercel
- Environment variables configured on Vercel

## Environment Variables

The following environment variables are configured in Vercel:

1. **VITE_SUPABASE_URL**: `https://xcunrqfrxbfgdcqzfecv.supabase.co`
2. **VITE_SUPABASE_ANON_KEY**: (Configured as sensitive)

These are automatically injected during the build process on Vercel.

## Automatic Deployments (Recommended)

The project is connected to GitHub repository: `https://github.com/bydigzy-glitch/DESIGNERS-OS.git`

**Automatic deployments are enabled:**

- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment
- Pull requests → Preview deployment

To trigger an automatic deployment:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically:

1. Detect the push
2. Run `npm install`
3. Run `tsc && vite build`
4. Deploy to production

## Manual Deployment

If you need to deploy manually:

### Production Deployment

// turbo

```bash
vercel --prod
```

### Preview Deployment

// turbo

```bash
vercel
```

## Adding New Environment Variables

To add a new environment variable:

```bash
# For production
vercel env add VARIABLE_NAME production

# For preview
vercel env add VARIABLE_NAME preview

# For development
vercel env add VARIABLE_NAME development
```

## Deployment URLs

- **Production**: <https://designers-nqkejf9n1-bydigzy-glitchs-projects.vercel.app>
- **Vercel Dashboard**: <https://vercel.com/bydigzy-glitchs-projects/designers-os>

## Troubleshooting

### Build Fails

1. Check TypeScript errors: `npm run build` locally
2. Verify all environment variables are set in Vercel dashboard
3. Check build logs in Vercel dashboard

### Environment Variables Not Working

1. Ensure variables are prefixed with `VITE_` for Vite to expose them
2. Redeploy after adding new environment variables
3. Check that variables are added to the correct environment (production/preview/development)

### Rollback a Deployment

1. Go to Vercel Dashboard → Deployments
2. Find the previous successful deployment
3. Click "Promote to Production"

## Post-Deployment Checklist

After each deployment, verify:

- [ ] Application loads correctly
- [ ] Authentication works (Supabase connection)
- [ ] AI chat functionality works
- [ ] All pages are accessible
- [ ] No console errors in browser

## Notes

- The build command is: `tsc && vite build`
- Output directory is: `dist`
- Node version: Auto-detected by Vercel
- Framework: Vite (React)
