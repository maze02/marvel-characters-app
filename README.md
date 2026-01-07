# Marvel Characters App

A modern, production-ready React application for browsing Marvel characters using Clean Architecture principles and Domain-Driven Design.

## 📚 Documentation

- **[Build & Development Guide](./BUILD.md)** - Development and production modes, build instructions
- **[Project Structure](./src/README.txt)** - Code organization and architecture

## ✨ Features

- 🦸 **Browse Characters**: Load 50 characters initially with infinite scroll
- 🔍 **Real-time Search**: Debounced search (400ms) with API filtering
- ❤️ **Favorites System**: Real-time favorites with localStorage persistence and React Query cache invalidation
- 📚 **Character Details**: View character information and first 20 comics with lazy loading
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop
- ♿ **Accessibility First**: WCAG compliant with ARIA labels and semantic HTML
- 🎨 **Design System**: Atomic design pattern with reusable components and design tokens
- 🏗️ **Clean Architecture**: Separation of concerns with DDD principles
- ✅ **Testing**: Comprehensive unit, integration, and E2E test coverage
- 🔍 **SEO**: Meta tags, Open Graph, and structured data for search engines
- 🔄 **State Management**: React Query for server state with optimistic updates and automatic refetching

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
# Development mode
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

### Testing

```bash
# Run all unit & integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Run specific E2E test file
npx playwright test e2e/01-character-list-and-search.spec.ts

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

Comprehensive testing across multiple layers:

- **Unit Tests**: Jest + Testing Library for components, hooks, business logic, and domain entities
- **Integration Tests**: Full feature testing with React Query and mocked external boundaries
- **E2E Tests**: Playwright covering complete user journeys and edge cases

### Test Coverage

#### Unit Tests (Jest + Testing Library)
- **Domain Layer**: Entities (Character, Comic), Value Objects (CharacterId, CharacterName, ImageUrl, ReleaseDate)
- **Application Layer**: Use cases, mappers (ComicVineCharacterMapper, ComicVineComicMapper)
- **Infrastructure Layer**: Repositories (ComicVineCharacterRepository, LocalStorageFavoritesRepository), API clients
- **UI Layer**: Components (Button, SearchBar, CharacterCard, FavoriteButton), Hooks (useSEO, useDebouncedValue, useAdaptiveLineClamp)

#### Integration Tests
- **User Flows**: Cross-page navigation, search, favorites management with React Query cache
- **Routing**: AppRouter with full context providers
- **Pages**: ListPage, DetailPage, FavoritesPage with real user interactions

#### E2E Tests (Playwright)
- Character listing, search, and infinite scroll
- Favorites management (add, remove, persist, cache invalidation)
- Character detail pages and comics lazy loading
- Empty states, error handling, and recovery
- Direct navigation, browser history, keyboard navigation
- Mobile responsive behavior and accessibility

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router v6
- **Styling**: SCSS Modules with BEM methodology, design tokens with CSS variables
- **State Management**: React Query (TanStack Query) for server state, React Context for client state
- **Testing**: Jest, Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **API**: Comic Vine API with Vercel serverless proxy
- **Storage**: localStorage with React Query cache invalidation
- **SEO**: Service-based architecture with dependency injection
- **Build**: Vite with optimized production builds

## 🔍 SEO & Discoverability

Built with search engine optimization following Clean Architecture and Hexagonal Architecture principles:

- **Meta Tags**: Dynamic page titles and descriptions for each route
- **Open Graph Protocol**: Rich previews on Facebook, LinkedIn, and other social platforms
- **Structured Data**: JSON-LD schema for better search engine understanding
- **Sitemap & Robots.txt**: Complete search engine coverage and crawling instructions

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
│   │   └── character/       # Character entities, value objects, ports
│   ├── application/         # Use cases, DTOs, and service ports
│   │   ├── character/       # Character use cases, mappers, DTOs
│   │   └── seo/             # SEO service interface (Port)
│   ├── infrastructure/      # External adapters and implementations
│   │   ├── http/            # API client (Comic Vine)
│   │   ├── repositories/    # Data access implementations
│   │   ├── storage/         # localStorage adapter
│   │   ├── logging/         # Logger implementation
│   │   ├── seo/             # SEO service implementation (Adapter)
│   │   ├── config/          # Environment configuration
│   │   └── dependencies/    # Dependency injection container
│   ├── ui/                  # React components and presentation
│   │   ├── components/      # Shared components (Layout, Navbar, SEO)
│   │   ├── designSystem/    # Atomic design (atoms, molecules, tokens)
│   │   ├── pages/           # Page components
│   │   ├── queries/         # React Query hooks and cache keys
│   │   ├── providers/       # React Query configuration
│   │   ├── routes/          # App routing configuration
│   │   ├── state/           # Context providers (Favorites, Dependencies)
│   │   └── hooks/           # Custom React hooks
│   ├── config/              # App constants
│   └── tests/               # Test utilities and mocks
├── e2e/                     # End-to-end tests (Playwright)
├── api/                     # Vercel serverless proxy
└── public/                  # Static assets
```

## 🚢 Deployment

Configured for deployment on Vercel with serverless API proxy:

```bash
# Build for production
npm run build
```

The `dist/` folder contains optimized assets ready for deployment. Compatible with Vercel (recommended), Netlify, Cloudflare Pages, and similar platforms.

**Production Setup**: Set `COMICVINE_API_KEY` as a server-side environment variable in your hosting platform to keep the API key secure.

## 👨‍💻 Development

### Component Development

```bash
# Run Storybook
npm run storybook
```



---
