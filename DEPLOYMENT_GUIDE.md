# 🚀 1-Click Free Cloud Deployment Guide for Shriramwar Opticals

Your optical shop web system is completely production-built and optimized for 100% free hosting on **Vercel** or **Netlify**.

---

## Option 1: Deploy to Vercel (Recommended - Fastest & 100% Free)

1. Push your code to **GitHub** (or open [vercel.com](https://vercel.com) and sign in with GitHub).
2. Click **"Add New..."** &rarr; **"Project"**.
3. Select your repository: `SHRIRAMWAR-OPTICALS`.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://lvjfozpmmbmzrsjieiji.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_Yl2HhApKfSr3hH8le-YecA_OEjO9PCm`
   - `VITE_ENABLE_DEMO_DATA` = `true`
5. Click **"Deploy"**!
   - In less than 1 minute, you will get a live public HTTPS link (e.g. `https://shriramwar-opticals.vercel.app`) accessible from any smartphone, tablet, or PC!

---

## Option 2: Deploy using Vercel CLI directly from terminal

If you want to deploy right now from your terminal:
```powershell
npx -y vercel
```
Follow the prompts (choose defaults) and it will deploy instantly to a live `.vercel.app` URL!

---

## Option 3: Deploy to Netlify (Free)

1. Go to [netlify.com](https://netlify.com) and drag-and-drop the `dist` folder, or connect your GitHub repository.
2. In Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Add the same Environment Variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
4. Click **Deploy Site**!

---

## 🔒 Security & Admin Access on Live Site

- Only you can unlock the app using your **Admin Password** (set in **Shop Settings**).
- Your PostgreSQL database in Supabase Mumbai is protected by Row Level Security (RLS).
