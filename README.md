# RMF SME — Risk Management Framework Expert
### AI-Powered NIST RMF Subject Matter Expert Website

---

## What This Is

A production-ready website that provides an AI-powered chat interface for NIST Risk Management Framework (RMF) guidance. Users can ask questions about FISMA, FedRAMP, NIST 800-53, ATOs, SSPs, POA&Ms, and all things federal cybersecurity compliance.

The API key is stored **securely on the server** — it is never exposed to the browser.

---

## Project Structure

```
rmf-sme/
├── api/
│   └── chat.js          ← Secure serverless API proxy (Vercel Edge Function)
├── public/
│   └── index.html       ← Frontend website
├── vercel.json          ← Vercel deployment configuration
└── README.md
```

---

## Deploy to Vercel (Free — Recommended)

### Step 1: Get an Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Navigate to **API Keys** → **Create Key**
4. Copy your key (starts with `sk-ant-...`) — save it somewhere safe

### Step 2: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 3: Deploy
In the `rmf-sme` folder, run:
```bash
vercel
```
- Follow the prompts (create a new project, accept defaults)
- When asked about the framework, select **Other**

### Step 4: Add Your API Key (Critical!)
```bash
vercel env add ANTHROPIC_API_KEY
```
- When prompted, paste your Anthropic API key
- Select **Production**, **Preview**, and **Development** environments

### Step 5: Redeploy with the Key
```bash
vercel --prod
```

Your site is now live! Vercel gives you a free URL like `https://rmf-sme.vercel.app`

---

## Custom Domain (Optional)

In the Vercel dashboard:
1. Go to your project → **Settings** → **Domains**
2. Add your domain (e.g., `rmfsme.com`)
3. Update your DNS records as instructed

---

## Alternative: Deploy via Vercel Dashboard (No CLI)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Under **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
5. Click **Deploy**

---

## Cost Estimate

- **Vercel hosting**: Free (Hobby plan covers this easily)
- **Anthropic API**: ~$0.003 per conversation exchange using Claude Sonnet
  - 1,000 questions ≈ ~$3
  - Add usage limits in the Anthropic console to cap spending

---

## Security Features Built In

- ✅ API key stored as server environment variable (never in browser)
- ✅ Conversation history trimmed to last 20 messages (prevents token abuse)
- ✅ Input validation on the server
- ✅ Error messages never expose internal details

---

## Optional Enhancements

- **Rate limiting**: Add [Vercel's built-in rate limiting](https://vercel.com/docs/security/rate-limiting) or use Upstash Redis
- **Auth**: Add Clerk or Auth0 if you want login-protected access
- **Analytics**: Add Vercel Analytics (one line of code)

---

## Support

Questions about RMF? The AI is built to help.
Questions about deployment? Check [Vercel Docs](https://vercel.com/docs).
