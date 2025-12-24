# Marvel Characters App

A modern, production-ready React application for browsing Marvel characters using Clean Architecture principles and Domain-Driven Design.

## 📚 Documentation

- **[Build & Development Guide](./BUILD.md)** - Development and production modes, build instructions
- **[Deployment Guide](./DEPLOYMENT.md)** - Free hosting options (GitHub Pages, Netlify, Vercel, Cloudflare)
- **[Vercel Setup Guide](./VERCEL_SETUP.md)** - Step-by-step Vercel CLI deployment with environment variables
- **[Project Structure](./src/README.txt)** - Code organization and architecture

## ✨ Features

- 🦸 **Browse Characters**: Load 50 characters initially with infinite scroll
- 🔍 **Real-time Search**: Debounced search (300ms) with API filtering
- ❤️ **Favorites System**: Save favorite characters with localStorage persistence
- 📚 **Character Details**: View character information and first 20 comics
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop
- ♿ **Accessibility First**: WCAG compliant with ARIA labels and semantic HTML
- 🎨 **Design System**: Atomic design pattern with reusable components and design tokens
- 🏗️ **Clean Architecture**: Separation of concerns with DDD principles
- ✅ **Comprehensive Testing**: Unit, integration, and E2E tests with Jest + Testing Library + Playwright
- 🔍 **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, and structured data for search engines
- 🔄 **UX Optimizations**: Proper loading states, error handling, and smooth transitions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Comic Vine API key ([Get one here](https://comicvine.gamespot.com/api/))

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your API key to .env
VITE_COMICVINE_API_KEY=your_api_key_here
```

### Running the App

```bash
# Development mode (assets not minimized, can be concatenated)
npm run dev

# Production build (assets concatenated and minimized)
npm run build

# Preview production build locally
npm run preview

# Development build (for testing production-like environment)
npm run build:dev
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Run E2E tests in headed browser (see what's happening)
npm run test:e2e:headed

# Type checking
npm run typecheck
```

## 🏗️ Architecture

This project follows **Clean Architecture** and **Domain-Driven Design** principles:

```
src/
├── domain/          # Business entities and rules (framework-independent)
├── application/     # Use cases and business logic orchestration
├── infrastructure/  # External services, APIs, storage adapters
└── ui/             # React components, pages, and presentation logic
```

### Key Architectural Decisions

- **Dependency Inversion**: Domain layer has no dependencies on external frameworks
- **Repository Pattern**: Abstract data access behind interfaces
- **Dependency Injection**: Centralized DI container for managing dependencies
- **Value Objects**: Type-safe domain primitives with validation
- **Use Cases**: Single-responsibility business operations

## 🎨 Design System

Built with **Atomic Design** methodology:

- **Atoms**: Button, Icon, Input, Logo, Skeleton, LoadingBar
- **Molecules**: CharacterCard, SearchBar, FavoriteButton, ComicsHorizontalScroll
- **Organisms**: CharacterHero, Navbar, Layout
- **Pages**: ListPage, DetailPage, FavoritesPage

### Design Tokens

Centralized design tokens for consistency and maintainability:
- **Colors**: Semantic color tokens (primary, text, background, etc.)
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale
- **Shadows**: Elevation system
- **Breakpoints**: Responsive breakpoints for mobile, tablet, desktop
- **Dimensions**: Reusable dimension values
- **Utility Mixins**: Common patterns (flex-center, focus-outline, triangle-clip, etc.)

## 🧪 Testing Strategy

- **Unit Tests**: Jest + Testing Library for components and business logic
- **Integration Tests**: Full feature testing with mocked dependencies
- **E2E Tests**: Playwright with 15 comprehensive tests covering:
  - Character listing and search functionality
  - Favorites management (add, remove, persist)
  - Character detail page and comics display
  - Navigation and user flows
  - Mobile responsive behavior (READ MORE/HIDE button functionality)
- **Test Coverage**: Comprehensive coverage for domain, application, and UI layers

## 🔄 UX Improvements

Recent UX enhancements for better user experience:

- **Loading States**: Separate loading indicators for character and comics data
- **Empty States**: Clear messaging when no data is available
- **Error Handling**: Graceful fallbacks with user-friendly error messages
- **Optimistic Updates**: Instant feedback for favorite toggles
- **Debounced Search**: Reduced API calls with 300ms debounce

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router v6
- **Styling**: SCSS Modules with BEM methodology, Custom Design System with CSS variables
- **State Management**: React Context API (FavoritesContext, DependenciesContext, LoadingContext)
- **Testing**: Jest, Testing Library, Playwright (E2E tests fully implemented)
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **API**: Comic Vine API integration with server-side proxy for production
- **Storage**: localStorage for favorites persistence
- **SEO**: Service-based architecture with dependency injection for meta tags and structured data
- **Build**: Vite with separate development and production modes

## 🔍 SEO & Discoverability

Built with search engine optimization following Clean Architecture and Hexagonal Architecture principles:

- **Meta Tags**: Dynamic page titles and descriptions for each route
- **Open Graph Protocol**: Rich previews on Facebook, LinkedIn, and other social platforms
- **Twitter Cards**: Enhanced sharing experience on Twitter
- **Structured Data**: JSON-LD schema for better search engine understanding
- **Sitemap & Robots.txt**: Complete search engine coverage and crawling instructions
- **Canonical URLs**: Prevents duplicate content issues
- **Hexagonal Architecture**: SEO service follows DDD principles with dependency injection

### Architecture

```
UI Layer (React Components)
    ↓ uses
SEO Component → useServices() hook
    ↓ gets from
Dependency Container
    ↓ provides
SEOService (Interface) ← Application Layer Port
    ↑ implements
BrowserSEOService ← Infrastructure Layer Adapter
```

**Benefits:**
- Easy to test (mock the SEOService)
- Easy to extend (add SSR, analytics, etc.)
- Consistent with rest of application architecture
- No direct DOM manipulation in UI components

See [SEO Architecture Documentation](./src/application/seo/README.md) for detailed implementation.

## 📝 Code Quality

Pre-commit hooks ensure code quality:

```bash
# Automatically runs on commit:
- ESLint with TypeScript, React Hooks, and JSX A11y plugins
- Prettier formatting
- TypeScript type checking

# Bypass hooks if needed (not recommended):
git commit --no-verify
```

## 🌐 API Configuration

This app uses the [Comic Vine API](https://comicvine.gamespot.com/api/) for Marvel character data:

1. Create an account at [Comic Vine](https://comicvine.gamespot.com/api/)
2. Generate an API key (minimum 40 characters)
3. Add to `.env` file:
   ```bash
   VITE_COMICVINE_API_KEY=your_api_key_here
   ```

**Production Note**: For production deployments (e.g., Vercel), use server-side environment variable `COMICVINE_API_KEY` instead of `VITE_COMICVINE_API_KEY` to keep the API key secure and out of the browser bundle.

## 📦 Project Structure

```
├── src/
│   ├── domain/              # Domain entities and business rules
│   ├── application/         # Use cases, DTOs, and service ports
│   │   ├── character/       # Character-related use cases
│   │   └── seo/             # SEO service interface (Port)
│   ├── infrastructure/      # API clients, repositories, DI, adapters
│   │   ├── repositories/    # Data access implementations
│   │   ├── seo/             # SEO service implementation (Adapter)
│   │   └── dependencies/    # Dependency injection container
│   ├── ui/                  # React components and pages
│   │   ├── components/      # Reusable components (including SEO)
│   │   ├── pages/           # Page components
│   │   └── state/           # Context providers and hooks
│   ├── config/              # App configuration
│   └── tests/               # Test utilities and mocks
├── e2e/                     # End-to-end tests (Playwright)
│   ├── helpers.ts           # E2E test utilities and helpers
│   └── *.spec.ts            # E2E test suites
├── api/                     # Vercel serverless functions (API proxy)
├── public/                  # Static assets (sitemap, robots.txt)
└── .storybook/              # Storybook configuration
```

## 🚢 Deployment

The app is configured for deployment on Vercel with serverless API proxy:

```bash
# Build for production
npm run build

# Deploy to Vercel production
npm run deploy

# Deploy to Vercel preview
npm run deploy:preview
```

**Output**: The `dist/` folder contains optimized, minified assets ready for deployment.

**Compatible with**: Vercel (recommended), Netlify, GitHub Pages, Cloudflare Pages, etc.

**Note**: For production, ensure `COMICVINE_API_KEY` is set as a server-side environment variable in your hosting platform.

## 👨‍💻 Development

### Component Development

```bash
# Run Storybook for component development
npm run storybook
```

### Git Workflow

This project uses feature branches with pull requests:

```
main (production)
  └── development
       ├── feature/01-setup
       ├── feature/02-domain
       ├── feature/03-application
       └── ...
```

## 📄 License

This project is for portfolio/interview purposes.

---

**Built with Clean Architecture, Domain-Driven Design, and modern React best practices.**
