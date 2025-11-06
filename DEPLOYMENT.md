# 🚀 Deployment Guide

## Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from project root:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? Press enter (use default)
   - Directory? Press enter (use `.`)
   - Override settings? **N**

5. For production deployment:
```bash
vercel --prod
```

### Method 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Configure project:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click "Deploy"

### Method 3: Vercel GitHub Integration

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: Iggy Pop Tennis Ball Riot"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. Connect repository to Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Vercel will auto-detect settings from `vercel.json`
   - Click "Deploy"

3. Automatic deployments:
   - Every push to `main` branch = production deployment
   - Every pull request = preview deployment

## Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy via Netlify CLI:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

Or use Netlify Dashboard:
- Drag and drop the `dist` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

## Deploy to GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to package.json scripts:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

3. Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/tennis-ball-gig/', // Your repo name
  // ... rest of config
});
```

4. Deploy:
```bash
npm run deploy
```

## Environment Variables

If you need environment variables (not required for this game):

### Vercel
Add in Dashboard → Project Settings → Environment Variables

### Netlify
Add in Dashboard → Site Settings → Environment Variables

### Local Development
Create `.env` file (already in .gitignore):
```
VITE_API_KEY=your_key_here
```

Access in code:
```javascript
const apiKey = import.meta.env.VITE_API_KEY;
```

## Performance Optimization

Before deploying, consider:

1. **Optimize Assets**: Compress images if adding any
2. **Enable Compression**: Most platforms do this automatically
3. **CDN**: Vercel/Netlify provide global CDN automatically
4. **Caching**: Configured in vercel.json

## Custom Domain

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS (follow Vercel instructions)

### Netlify
1. Go to Domain Settings
2. Add custom domain
3. Configure DNS (follow Netlify instructions)

## Post-Deployment Checklist

- ✅ Game loads without errors
- ✅ All 5 levels are playable
- ✅ Physics works correctly
- ✅ UI controls are responsive
- ✅ Animations play smoothly
- ✅ Score tracking works
- ✅ Mobile responsiveness (if implemented)

## Troubleshooting

### Build fails
- Check Node version (recommended: v18+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for missing dependencies

### Game doesn't load
- Check browser console for errors
- Verify all assets loaded
- Check network tab for failed requests

### Physics issues
- Check Matter.js is properly bundled
- Verify PIXI.js version compatibility

### Performance issues
- Check browser compatibility (modern browsers only)
- Test on different devices
- Monitor frame rate in dev tools

## Monitoring

Both Vercel and Netlify provide:
- Analytics (visitor stats)
- Performance monitoring
- Error tracking
- Build logs

---

**Your game is now live! Share the URL and rock on! 🎸🎾**
