# Environment Setup

## Security Notice

**IMPORTANT**: Never commit your `.env` file to version control. It contains sensitive API keys.

## Setup Instructions

1. **Copy the example environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Get your Gemini API Key:**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key

3. **Update your `.env` file:**

   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Restart your development server:**

   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_GEMINI_API_KEY` - Your Google Gemini API key for AI features
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Security Best Practices

✅ **DO:**

- Keep your `.env` file local and never commit it
- Use `.env.example` to document required variables
- Rotate API keys if they are accidentally exposed
- Use environment variables for all sensitive data

❌ **DON'T:**

- Hardcode API keys in source files
- Commit `.env` to git
- Share API keys in chat/email
- Use production keys in development

## Troubleshooting

If AI features stop working:

1. Check that your `.env` file exists and has valid keys
2. Verify the API key is active in Google AI Studio
3. Restart the development server
4. Check browser console for error messages
