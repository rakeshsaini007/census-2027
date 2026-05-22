<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7da073d1-aecd-4a78-a2ae-5b5271330ee0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

This app is optimized to build and run seamlessly on **Vercel** as a high-performance Single Page Application (SPA).

### Method 1: Using the Vercel Dashboard (Recommended)

1. **Push your code to GitHub, GitLab, or Bitbucket.**
   - Ensure the `vercel.json` file we configured at the root is committed to your repository.
2. **Import to Vercel:**
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New...** > **Project**.
   - Import your repository.
3. **Configure Project Settings:**
   - **Framework Preset**: Choose **Vite** (Vercel will detect this automatically).
   - **Build Command**: `npm run build` or `vite build` (Default).
   - **Output Directory**: `dist` (Default).
4. **Deploy:**
   - Click **Deploy**. Vercel will build your React + TS application and supply you with a swift, global URL.

### Method 2: Deployment via Vercel CLI

If you prefer deploying directly from your terminal:

1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. Run the deployment command in your project's root directory:
   ```bash
   vercel
   ```
3. Follow the interactive prompts to log in, link your project, and build.
4. Deploy to production when ready:
   ```bash
   vercel --prod
   ```

