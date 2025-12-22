# Marvel Characters App

A modern, production-ready React application for browsing Marvel characters using Clean Architecture principles and Domain-Driven Design.

## 📚 Documentation

- **[Build & Development Guide](./BUILD.md)** - Development and production modes, build instructions
- **[Deployment Guide](./DEPLOYMENT.md)** - Free hosting options (GitHub Pages, Netlify, Vercel, Cloudflare)
- **[Vercel Setup Guide](./VERCEL_SETUP.md)** - Step-by-step Vercel CLI deployment with environment variables
- **[Project Structure](./src/README.txt)** - Code organization and architecture

## ✨ Features

- 🦸 **Browse Characters**: Infinite scroll through Marvel's extensive character catalog
- 🔍 **Real-time Search**: Debounced search with instant results
- ❤️ **Favorites System**: Save favorite characters with localStorage persistence
- 📚 **Character Details**: View character information and associated comics
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop
- ♿ **Accessibility First**: WCAG compliant with ARIA labels and semantic HTML
- 🎨 **Design System**: Atomic design pattern with reusable components
- 🏗️ **Clean Architecture**: Separation of concerns with DDD principles
- ✅ **Comprehensive Testing**: Unit, integration, and E2E tests
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
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

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

Centralized design tokens for consistency:
- Colors, Typography, Spacing, Shadows, Breakpoints

## 🧪 Testing Strategy

- **Unit Tests**: Jest + Testing Library for components and business logic
- **Integration Tests**: Full feature testing with mocked dependencies
- **E2E Tests**: Playwright for critical user flows
- **Test Coverage**: 29/31 test suites passing

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
- **Styling**: SCSS Modules, Custom Design System
- **State Management**: React Context API
- **Testing**: Jest, Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **API**: Comic Vine API integration
- **Storage**: localStorage for favorites persistence

## 📝 Code Quality

Pre-commit hooks ensure code quality:

```bash
# Automatically runs on commit:
- ESLint with SonarJS, Unicorn plugins
- Prettier formatting
- TypeScript type checking

# Bypass hooks if needed (not recommended):
git commit --no-verify
```

## 🌐 API Configuration

This app uses the [Comic Vine API](https://comicvine.gamespot.com/api/):

1. Create an account at Comic Vine
2. Generate an API key
3. Add to `.env`: `VITE_COMICVINE_API_KEY=your_key`

## 📦 Project Structure

```
├── src/
│   ├── domain/             # Domain entities and business rules
│   ├── application/        # Use cases and DTOs
│   ├── infrastructure/     # API clients, repositories, DI
│   ├── ui/                 # React components and pages
│   ├── config/             # App configuration
│   └── tests/              # Test utilities and mocks
├── e2e/                    # Playwright E2E tests
├── public/                 # Static assets
└── .storybook/             # Storybook configuration
```

## 🚢 Deployment

```bash
# Build for production
npm run build

# Output in dist/ folder ready for deployment
# Compatible with Vercel, Netlify, GitHub Pages, etc.
```

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
