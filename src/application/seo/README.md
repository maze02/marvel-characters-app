# SEO Service Architecture

This document explains how SEO is implemented following **Domain-Driven Design (DDD)** and **Hexagonal Architecture** principles.

## Overview

The SEO functionality helps search engines understand your pages by managing meta tags, Open Graph tags, Twitter Cards, and structured data.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI LAYER                                 │
│  - SEO Component (React)                                    │
│  - Uses SEOService via Dependency Injection                 │
│  Location: src/ui/components/SEO/                           │
└─────────────────────────────────────────────────────────────┘
                            ↓ depends on
┌─────────────────────────────────────────────────────────────┐
│               APPLICATION LAYER                             │
│  - SEOService (Interface/Port)                              │
│  - Defines what SEO operations are available                │
│  Location: src/application/seo/ports/SEOService.ts          │
└─────────────────────────────────────────────────────────────┘
                            ↑ implemented by
┌─────────────────────────────────────────────────────────────┐
│             INFRASTRUCTURE LAYER                            │
│  - BrowserSEOService (Concrete Implementation/Adapter)      │
│  - Manipulates browser DOM to update meta tags              │
│  Location: src/infrastructure/seo/BrowserSEOService.ts      │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Dependency Inversion Principle (DIP)
- High-level code (UI) depends on abstraction (SEOService interface)
- Low-level code (BrowserSEOService) implements the abstraction
- Direction of dependency: UI → Application ← Infrastructure

### 2. Single Responsibility Principle (SRP)
- **SEOService**: Defines the contract for SEO operations
- **BrowserSEOService**: Implements DOM manipulation
- **SEO Component**: Manages React lifecycle and props

### 3. Open/Closed Principle (OCP)
- Easy to add new SEO implementations (e.g., SSR, testing mocks)
- No need to modify existing code

### 4. Dependency Injection
- SEOService is injected via DependencyContainer
- Components get service through `useServices()` hook
- Easy to swap implementations for testing

## Usage

### In a React Component

```typescript
import { SEO } from '@ui/components/SEO';

export const MyPage = () => {
  return (
    <>
      <SEO
        title="My Page Title"
        description="Description for search engines"
        canonicalUrl="https://example.com/my-page"
        image="https://example.com/image.jpg"
      />
      {/* Page content */}
    </>
  );
};
```

### Direct Service Usage (Advanced)

```typescript
import { useServices } from '@ui/state';

export const MyComponent = () => {
  const { seo } = useServices();
  
  useEffect(() => {
    seo.updateMetadata({
      title: "Dynamic Title",
      description: "Dynamic description"
    });
  }, [seo]);
  
  return <div>Content</div>;
};
```

## Testing

### Unit Testing SEO Component

```typescript
import { render } from '@testing-library/react';
import { SEO } from '@ui/components/SEO';
import { DependenciesProvider } from '@ui/state';
import { DependencyContainer } from '@infrastructure/dependencies/DependencyContainer';

// Create mock SEO service
class MockSEOService implements SEOService {
  updateMetadata = jest.fn();
  addStructuredData = jest.fn();
  removeStructuredData = jest.fn();
  reset = jest.fn();
}

test('SEO updates metadata', () => {
  const mockSEO = new MockSEOService();
  const container = DependencyContainer.createForTesting(
    mockCharacterRepo,
    mockFavoritesRepo,
    mockSEO
  );
  
  render(
    <DependenciesProvider container={container}>
      <SEO title="Test" description="Test description" />
    </DependenciesProvider>
  );
  
  expect(mockSEO.updateMetadata).toHaveBeenCalledWith({
    title: "Test",
    description: "Test description"
  });
});
```

## Benefits

### ✅ Testability
- Easy to mock SEOService in tests
- No direct DOM manipulation in tests
- Isolated component testing

### ✅ Maintainability
- Clear separation of concerns
- Single source of truth for SEO logic
- Easy to understand and modify

### ✅ Flexibility
- Easy to add SSR support (create SSRSEOService)
- Easy to add analytics (extend SEOService)
- Easy to change implementation without changing UI

### ✅ Consistency
- Follows same pattern as rest of the application
- All dependencies managed through DI container
- Clean Architecture compliance

## File Structure

```
src/
├── application/
│   └── seo/
│       └── ports/
│           └── SEOService.ts          # Interface (Port)
├── infrastructure/
│   └── seo/
│       └── BrowserSEOService.ts       # Implementation (Adapter)
│   └── dependencies/
│       └── DependencyContainer.ts     # DI Container (includes SEOService)
└── ui/
    ├── components/
    │   └── SEO/
    │       ├── SEO.tsx                # React Component
    │       └── index.ts               # Exports
    └── state/
        └── DependenciesContext.tsx    # Provides useServices() hook
```

## Clean Code Principles Applied

1. **Meaningful Names**: SEOService, BrowserSEOService, updateMetadata
2. **Small Functions**: Each function has single responsibility
3. **No Side Effects**: Pure dependency injection pattern
4. **Comments When Needed**: Complex parts explained for non-developers
5. **DRY**: No repeated code, reusable service
6. **SOLID Principles**: All five principles followed

## Comparison with Previous Implementation

### Before (Hook-based)
```typescript
// Direct DOM manipulation in hook
useSEO({ title: "...", description: "..." });
// ❌ Hard to test
// ❌ No dependency injection
// ❌ Inconsistent with rest of app
```

### After (Service-based)
```typescript
// Service via DI
const { seo } = useServices();
seo.updateMetadata({ title: "...", description: "..." });
// ✅ Easy to test (mock service)
// ✅ Dependency injection
// ✅ Consistent with architecture
```

## Future Enhancements

Possible extensions without breaking existing code:

1. **SSR Support**: Create `SSRSEOService` implementation
2. **Analytics**: Extend SEOService to include tracking
3. **A/B Testing**: Different SEO strategies via different services
4. **Caching**: Add caching layer to SEOService
5. **Validation**: Add SEO best practices validation

All can be added without modifying existing UI code!

