import type { Meta, StoryObj } from "@storybook/react";
import { LoadingBar } from "./LoadingBar";

/**
 * LoadingBar Component
 *
 * A thin red progress bar that appears at the top of the viewport during navigation/loading.
 * Positioned below the navbar with a smooth indeterminate animation.
 *
 * ## Features
 * - Fixed positioning below navbar (top: 84px)
 * - Marvel red (#EC1D24) color with smooth animation
 * - Accessible with ARIA attributes
 * - Automatically hides when loading completes
 *
 * ## Usage
 * Used in the Layout component to provide global loading feedback across all pages.
 * Controlled by the LoadingContext for centralized loading state management.
 */
const meta: Meta<typeof LoadingBar> = {
  title: "Design System/Atoms/LoadingBar",
  component: LoadingBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A fixed position loading bar that provides visual feedback during async operations. Appears below the navbar and animates smoothly from left to right.",
      },
    },
  },
  argTypes: {
    isLoading: {
      control: "boolean",
      description: "Whether the loading bar is visible and animating",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          minHeight: "200px",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Navbar placeholder to show positioning context */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "84px",
            backgroundColor: "#202020",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "14px",
            zIndex: 1000,
          }}
        >
          Navbar (84px height) - LoadingBar appears below this
        </div>
        <Story />
        {/* Content area to show full context */}
        <div
          style={{ paddingTop: "100px", padding: "2rem", textAlign: "center" }}
        >
          <p style={{ color: "#666", fontSize: "14px" }}>
            Page content area - LoadingBar is fixed at top
          </p>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoadingBar>;

/**
 * Loading state - shows the animated progress bar.
 * This is what users see when data is being fetched or pages are loading.
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The loading bar animates continuously with a smooth indeterminate progress animation. Marvel red color (#EC1D24) matches the brand.",
      },
    },
  },
};

/**
 * Not loading state - loading bar is hidden.
 * This is the default state when no async operations are in progress.
 */
export const NotLoading: Story = {
  args: {
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "When isLoading is false, the component returns null and nothing is rendered. This is the default state.",
      },
    },
  },
};

/**
 * Interactive playground.
 * Toggle the loading state to see the animation start and stop.
 */
export const Playground: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the controls below to toggle the loading state and see the animation in action.",
      },
    },
  },
};

/**
 * Real-world context: During page navigation.
 * Shows how the loading bar appears in a full page layout.
 */
export const InPageContext: Story = {
  args: {
    isLoading: true,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          backgroundColor: "#fff",
        }}
      >
        {/* Realistic navbar */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "84px",
            backgroundColor: "#202020",
            display: "flex",
            alignItems: "center",
            padding: "0 2rem",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div
            style={{ color: "#EC1D24", fontSize: "24px", fontWeight: "bold" }}
          >
            MARVEL
          </div>
        </header>
        <Story />
        {/* Page content */}
        <main style={{ paddingTop: "120px", padding: "140px 2rem 2rem" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "1rem" }}>
            Character List
          </h1>
          <p style={{ color: "#666", marginBottom: "2rem" }}>
            Loading characters from the API...
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  height: "300px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        </main>
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "Example showing the loading bar in a full page context during character list loading. The loading bar sits between the navbar and the page content.",
      },
    },
  },
};

/**
 * Accessibility features demonstration.
 * Shows screen reader announcements and ARIA attributes.
 */
export const Accessibility: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Accessibility Features:
- **role="progressbar"**: Identifies the loading bar as a progress indicator
- **aria-label="Loading content"**: Provides clear context for screen readers
- **aria-busy="true"**: Indicates the page is busy loading
- **aria-live="polite"**: Announces loading status without interrupting
- **Hidden text**: "Loading content" is available to screen readers but visually hidden
        `,
      },
    },
  },
};
