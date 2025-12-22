# Build Modes Documentation

This project uses **Vite** as the build tool, which provides optimized development and production modes.

## 🚀 Quick Start

### Development Mode (Modo Desarrollo)
```bash
npm run dev
```

**Features:**
- ✅ Assets served **unminified** (sin minimizar)
- ✅ No concatenation (módulos separados para debugging)
- ✅ Hot Module Replacement (HMR)
- ✅ Inline source maps
- ✅ Fast refresh for instant updates
- ✅ Auto-opens browser
- ✅ Debug logging enabled

**Output:** Development server at `http://localhost:5179/`

### Production Mode (Modo Producción)
```bash
npm run build
npm run preview  # Optional: preview production build locally
```

**Features:**
- ✅ Assets **minified with Terser** (minimizados)
- ✅ Assets **concatenated and chunked** (concatenados)
- ✅ Tree shaking (removes unused code)
- ✅ Code splitting (optimized chunks)
- ✅ Optimized images and fonts
- ✅ Gzip compression
- ✅ Production logging only

**Output:** Optimized files in `dist/` folder

### Development Build (Build sin minimizar)
```bash
npm run build:dev
```
Creates a build with development settings (useful for debugging production issues).

## 📁 Build Output Example

```bash
dist/
├── index.html                   1.67 kB │ gzip:  0.77 kB
├── assets/
│   ├── index-C__-d5Lz.css      24.10 kB │ gzip:  5.15 kB  ← CSS concatenado y minificado
│   ├── axios-VSpmzgsF.js       35.95 kB │ gzip: 14.10 kB  ← Chunk separado de axios
│   ├── index-DHnC1WbR.js      103.86 kB │ gzip: 28.50 kB  ← Código principal
│   └── vendor-CPeNQ4fM.js     160.79 kB │ gzip: 52.30 kB  ← React, Router, etc.
```

## 🔧 Environment Variables

### `.env.development`
- Loaded automatically in development mode
- Debug logging enabled
- Development API endpoints

### `.env.production`
- Loaded automatically in production mode
- Error-only logging
- Production API endpoints

### `.env` (local)
- Your local overrides
- Not committed to git
- Add your API key here: `VITE_COMIC_VINE_API_KEY=your_key`

## 🛠️ Technical Details

### Why Vite? (No webpack or Babel needed!)

**Vite replaces:**
- ❌ Webpack → ✅ Vite (faster, modern)
- ❌ Babel → ✅ esbuild (10-100x faster transpilation)
- ❌ webpack-dev-server → ✅ Vite dev server (instant HMR)

**Build Process:**

**Development Mode:**
1. Native ES modules in browser
2. On-demand compilation (only what's needed)
3. No bundling during dev (ultra-fast)
4. HMR in <50ms

**Production Mode:**
1. Full bundling with Rollup
2. Terser minification
3. Code splitting
4. Tree shaking
5. Asset optimization

## 🎯 Deployment

### Build for Production
```bash
npm run build
```

### Preview Locally
```bash
npm run preview
```

### Deploy the `dist/` folder
Upload the contents of `dist/` to your hosting provider:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting

## ✅ Summary

| Feature | Development | Production |
|---------|-------------|------------|
| Minification | ❌ No | ✅ Terser |
| Concatenation | ❌ Separate modules | ✅ Chunked bundles |
| Source Maps | ✅ Inline | ❌ Disabled |
| Code Splitting | ❌ No | ✅ vendor, axios chunks |
| Tree Shaking | ❌ No | ✅ Yes |
| Asset Optimization | ❌ No | ✅ Yes |
| Build Time | ⚡ Instant | ~2-3 seconds |

## 🔍 Verifying Build Modes

**Check if assets are minified:**
```bash
# Development build (should see readable code)
npm run build:dev
cat dist/assets/index-*.js  # Readable, unminified

# Production build (should see minified code)
npm run build
cat dist/assets/index-*.js  # Minified, one-line
```

**Check environment:**
```javascript
console.log(import.meta.env.MODE);  // 'development' or 'production'
console.log(import.meta.env.VITE_APP_ENV);
```

---

**Note:** You don't need webpack or Babel! Vite handles everything with modern, faster tools. 🚀
