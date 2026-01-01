# Deployment Guide - AI Features for All Users

## Overview

Your app now uses a **secure backend API proxy** to provide AI features to all users without exposing your API key. The API key is stored securely on the server (Vercel) and never exposed to the client.

## Architecture

```
User Browser → Frontend (React) → Backend API (/api/gemini) → Google Gemini AI
                                        ↑
                                   API Key (Secure)
```

### How It Works

1. **Development Mode**: Uses direct API key from `.env` for faster development
2. **Production Mode**: Routes all AI requests through `/api/gemini` endpoint
3. **API Key**: Stored as environment variable on Vercel, never exposed to client

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel
```

### 2. Configure Environment Variables on Vercel

After deployment, add your environment variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
VITE_GEMINI_API_KEY=your_new_rotated_api_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Click **Save**
5. Redeploy to apply changes

### 3. Rotate Your API Key (IMPORTANT!)

Since your old key was exposed:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Delete** the old exposed key
3. **Create** a new API key
4. **Update** the environment variable on Vercel
5. **Update** your local `.env` file

## Files Created

### `/api/gemini.ts`

Serverless function that handles AI requests securely on the backend.

### `/services/geminiProxy.ts`

Client-side service that routes requests to the backend API in production.

### `/vercel.json`

Vercel configuration for deployment.

## How Users Access AI

**All users can now use AI features without needing their own API key!**

- ✅ AI chat works out of the box
- ✅ Video concept analysis works
- ✅ All AI features available to everyone
- ✅ Your API key stays secure on the server
- ✅ No client-side exposure

## Development vs Production

### Development (Local)

- Uses direct API key from `.env`
- Faster (no API roundtrip)
- Good for testing

### Production (Vercel)

- Routes through `/api/gemini` endpoint
- API key secure on server
- Scalable and safe

## Monitoring & Limits

### API Usage

Monitor your Gemini API usage at:

- [Google AI Studio Dashboard](https://aistudio.google.com/)

### Rate Limiting (Optional)

To prevent abuse, you can add rate limiting to `/api/gemini.ts`:

```typescript
// Add at the top of the handler
const rateLimitMap = new Map();

// Check rate limit
const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
const now = Date.now();
const userRequests = rateLimitMap.get(ip) || [];
const recentRequests = userRequests.filter(time => now - time < 60000); // 1 minute

if (recentRequests.length >= 10) { // 10 requests per minute
  return res.status(429).json({ error: 'Too many requests' });
}

rateLimitMap.set(ip, [...recentRequests, now]);
```

## Security Checklist

- ✅ API key removed from source code
- ✅ API key stored in environment variables
- ✅ `.env` file in `.gitignore`
- ✅ Backend API proxy created
- ✅ Client routes through proxy in production
- ✅ Old API key will be rotated
- ✅ Vercel environment variables configured

## Troubleshooting

### AI not working in production?

1. Check Vercel environment variables are set
2. Check Vercel deployment logs
3. Verify API key is valid in Google AI Studio

### AI not working locally?

1. Check `.env` file exists
2. Verify `VITE_GEMINI_API_KEY` is set
3. Restart dev server

### "API key not configured" error?

- Environment variable not set on Vercel
- Redeploy after adding environment variables

## Cost Management

Your Gemini API usage will depend on:

- Number of users
- Frequency of AI requests
- Length of conversations

**Monitor your usage** regularly in Google AI Studio to avoid unexpected costs.

Consider implementing:

- User authentication (already done ✅)
- Request quotas per user
- Rate limiting
- Usage analytics

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Add environment variables
3. ✅ Rotate exposed API key
4. ✅ Test AI features in production
5. ⏳ Monitor API usage
6. ⏳ Implement rate limiting (optional)
