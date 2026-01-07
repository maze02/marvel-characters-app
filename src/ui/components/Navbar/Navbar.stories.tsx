import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";

/**
 * Navbar Component
 *
 * Primary navigation component with Marvel logo and favorites button.
 * Displays favorites count badge and highlights active navigation state.
 *
 * ## Features
 * - Marvel logo with click handler
 * - Favorites button with count badge
 * - Active state indication
 *
 * ## Dependencies
 * - React Router (for navigation and location)
 * - FavoritesContext (for favorites count)
 * - Logo component
 * - Icon component
 */

const meta: Meta<typeof Navbar> = {
  title: "Components/Navbar",
  component: Navbar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The main navigation bar component that appears at the top of all pages. Provides quick access to home and favorites. **Note**: Requires FavoritesContext and Router context to function properly.",
      },
    },
  },
  argTypes: {
    onLogoClick: {
      action: "logo clicked",
      description: "Optional callback when logo is clicked",
      table: {
        type: { summary: "() => void" },
      },
    },
    onFavoritesClick: {
      action: "favorites clicked",
      description: "Optional callback when favorites button is clicked",
      table: {
        type: { summary: "() => void" },
      },
    },
  },
  decorators: [
    (Story, context) => {
      return (
        <MemoryRouter initialEntries={[context.parameters?.route ?? "/"]}>
          <Story />
        </MemoryRouter>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

/**
 * Default navbar with no favorites.
 * This is the initial state when users first visit the app.
 */
export const Default: Story = {
  parameters: {
    route: "/",
    favoritesCount: 0,
    docs: {
      description: {
        story:
          "Default navbar state with no favorites. The favorites button is visible but has no count badge.",
      },
    },
  },
};

/**
 * Navbar with favorites count.
 * Shows the red badge with the number of favorited characters.
 */
export const WithFavorites: Story = {
  parameters: {
    route: "/",
    favoritesCount: 5,
    docs: {
      description: {
        story:
          "When users have favorites, a red badge appears on the favorites button showing the count.",
      },
    },
  },
};

/**
 * Navbar with many favorites.
 * Tests the badge appearance with double-digit numbers.
 */
export const WithManyFavorites: Story = {
  parameters: {
    route: "/",
    favoritesCount: 42,
    docs: {
      description: {
        story:
          "The badge adapts to accommodate larger numbers (double digits and beyond).",
      },
    },
  },
};

/**
 * Navbar on favorites page.
 * Shows the navbar when viewing the favorites route.
 */
export const OnFavoritesPage: Story = {
  parameters: {
    route: "/favorites",
    favoritesCount: 8,
    docs: {
      description: {
        story:
          'When on the favorites page, the aria-label changes to "Viewing favorites" for better accessibility.',
      },
    },
  },
};

/**
 * Navbar with custom callbacks.
 * Demonstrates custom navigation handlers for logo and favorites.
 */
export const WithCustomCallbacks: Story = {
  args: {
    onLogoClick: () => console.log("Custom logo click handler"),
    onFavoritesClick: () => console.log("Custom favorites click handler"),
  },
  parameters: {
    route: "/",
    favoritesCount: 3,
    docs: {
      description: {
        story:
          "Custom click handlers can be provided to override default navigation behavior. Check the Actions panel to see events.",
      },
    },
  },
};

/**
 * Interactive playground.
 * Try clicking on the logo and favorites button.
 */
export const Playground: Story = {
  parameters: {
    route: "/",
    favoritesCount: 7,
  },
};

/**
 * Real-world context: Full page layout.
 * Shows navbar in a complete page context with content below.
 */
export const InPageContext: Story = {
  parameters: {
    route: "/",
    layout: "fullscreen",
    favoritesCount: 12,
    docs: {
      description: {
        story:
          "Example showing the navbar in a full page layout with scrollable content. The navbar stays fixed at the top.",
      },
    },
  },
  render: (args) => (
    <div style={{ minHeight: "200vh", backgroundColor: "#f5f5f5" }}>
      <Navbar {...args} />
      <main style={{ paddingTop: "100px", padding: "140px 2rem 2rem" }}>
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "1rem",
            fontFamily: "system-ui",
          }}
        >
          Marvel Characters
        </h1>
        <p style={{ color: "#666", marginBottom: "2rem", fontSize: "16px" }}>
          Browse your favorite Marvel superheroes
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "400px",
                backgroundColor: "white",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          ))}
        </div>
      </main>
    </div>
  ),
};

/**
 * Navbar with LoadingBar.
 * Shows how the navbar works together with the loading bar component.
 */
export const WithLoadingBar: Story = {
  parameters: {
    route: "/",
    layout: "fullscreen",
    favoritesCount: 5,
    docs: {
      description: {
        story:
          "The LoadingBar component appears directly below the navbar (at 84px from top). This shows the visual relationship between these two components.",
      },
    },
  },
  render: (args) => (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#fff",
      }}
    >
      <Navbar {...args} />
      {/* Loading bar simulation */}
      <div
        style={{
          position: "fixed",
          top: "84px",
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: "#EC1D24",
          zIndex: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: "#EC1D24",
            animation: "loading 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
      </div>
      <main style={{ paddingTop: "120px", padding: "140px 2rem 2rem" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "1rem" }}>
          Loading Content...
        </h1>
        <p style={{ color: "#666" }}>
          Notice the red loading bar animating below the navbar
        </p>
      </main>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%) scaleX(0.3); }
          40% { transform: translateX(-20%) scaleX(0.6); }
          60% { transform: translateX(20%) scaleX(0.8); }
          80% { transform: translateX(60%) scaleX(0.4); }
          100% { transform: translateX(100%) scaleX(0.2); }
        }
      `}</style>
    </div>
  ),
};

/**
 * Responsive behavior demonstration.
 * Shows how the navbar adapts to different screen sizes.
 */
export const ResponsiveDemo: Story = {
  parameters: {
    route: "/",
    favoritesCount: 8,
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story:
          "The navbar is responsive and adapts to mobile, tablet, and desktop viewports. Try changing the viewport in Storybook toolbar.",
      },
    },
  },
};

/**
 * Accessibility features.
 * Demonstrates ARIA labels and keyboard navigation.
 */
export const Accessibility: Story = {
  parameters: {
    route: "/",
    favoritesCount: 3,
    docs: {
      description: {
        story: `
### Accessibility Features:
- **Semantic HTML**: Uses \`<header>\` and \`<button>\` elements
- **ARIA Labels**: Clear labels like "View favorites" and "Viewing favorites"
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus States**: Visible focus indicators for keyboard users
- **Test ID**: Includes data-testid for automated testing
- **Icon Accessibility**: Heart icon is decorative, button has descriptive label
        `,
      },
    },
  },
};

/**
 * Dark theme variant.
 * Shows the navbar against different background colors.
 */
export const DarkBackground: Story = {
  parameters: {
    route: "/",
    favoritesCount: 6,
    backgrounds: {
      default: "dark",
    },
    docs: {
      description: {
        story:
          "The navbar has a dark background (#202020) that works well with both light and dark page themes.",
      },
    },
  },
  render: (args) => (
    <div style={{ minHeight: "100vh", backgroundColor: "#1a1a1a" }}>
      <Navbar {...args} />
      <div
        style={{
          paddingTop: "100px",
          padding: "140px 2rem 2rem",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "1rem" }}>Dark Theme</h1>
        <p style={{ color: "#aaa" }}>Navbar maintains its dark appearance</p>
      </div>
    </div>
  ),
};
