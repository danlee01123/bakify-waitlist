# Bakify Waitlist — Deploy Guide

A real, deployable pre-launch waitlist page: email capture wired to Kit
(ConvertKit) so you actually own the list, plus a gated resource hub (Cottage
Bakery Starter Guide, cottage food law for all 50 states + D.C., and a
labeling checklist) that unlocks right after signup.

## What's in here
- `index.html` / `style.css` / `script.js` — the page itself
- `data.js` — the guide, labeling checklist, and state law content (generated from the markdown docs saved in your Bakify project)
- `api/subscribe.js` — a Vercel serverless function that adds each signup to your Kit form
- `package.json`, `vercel.json` — deploy config

## 1. Create a free Kit (ConvertKit) account
This is what actually stores emails and lets you send the welcome/guide email — free up to 10,000 subscribers.
1. Sign up at kit.com.
2. Create a new **Form** (Landing Pages & Forms → Forms → Create Form). Name it something like "Bakify Waitlist."
3. In that form's settings, find its **Form ID** (a number, visible in the embed code or the URL).
4. Get your **API Key** from Account Settings → Advanced → API (this is the v3 API key).
5. Optional but recommended: in the form's automation settings, add a rule "When someone subscribes to this form → send email → [the Starter Guide PDF or link]." That's what actually delivers the guide by email, separate from the on-page unlock.

## 2. Deploy to Vercel

You have two options — pick whichever you're more comfortable with. Either way, **this is a separate, small project from your main `bakify-web` app** — it doesn't touch that codebase.

### Option A — GitHub + Vercel dashboard (recommended, easiest to update later)
1. Create a new empty GitHub repo (e.g. `bakify-waitlist`).
2. Push this folder to it:
   ```
   git init
   git add .
   git commit -m "Bakify waitlist page"
   git branch -M main
   git remote add origin https://github.com/<you>/bakify-waitlist.git
   git push -u origin main
   ```
3. Go to vercel.com → Add New Project → Import your `bakify-waitlist` repo.
4. Before deploying, add two Environment Variables (Settings → Environment Variables):
   - `KIT_API_KEY` = your Kit API key from step 1
   - `KIT_FORM_ID` = your Kit form's numeric ID from step 1
5. Deploy. You'll get a URL like `bakify-waitlist.vercel.app` — put that in your Instagram bio.
6. Optional: add a custom domain (Settings → Domains) if you own one, or a subpath of your main domain later.

### Option B — Vercel CLI (no GitHub needed)
```
npm install -g vercel
cd bakify-waitlist   # this folder
vercel login
vercel                # deploys a preview
vercel --prod         # promotes to production
```
Then add the two environment variables in the Vercel dashboard for this project (or via `vercel env add KIT_API_KEY` / `vercel env add KIT_FORM_ID`), and redeploy with `vercel --prod` so the function picks them up.

## 3. Test it
Submit a real email on the live URL, then check your Kit dashboard — the subscriber should show up in your form within a few seconds. If you see an error on the page, check the Vercel function logs (Project → Deployments → the deployment → Functions → `/api/subscribe`) for the actual error message.

## Updating the content later
`data.js` is generated from three markdown docs saved in your Bakify Claude project: the Starter Guide, the Cottage Food Label Checklist, and the Cottage Food Law Reference (All 50 States + DC). If you edit those and want the site to reflect changes, regenerate `data.js` from the updated markdown (ask Claude to do this, or convert manually with a markdown-to-HTML tool) and redeploy.

## Important legal note
The state cottage food law content is compiled from official state sources and cross-checked against Forrager's database as of July 2026, but cottage food law changes often and a handful of states are flagged in the content itself as needing direct agency confirmation before you rely on the exact numbers. This is not legal advice — say so clearly anywhere this content is public-facing (it already is, in the page copy and the guide itself).
