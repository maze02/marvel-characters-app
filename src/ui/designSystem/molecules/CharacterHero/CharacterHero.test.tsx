/**
 * CharacterHero Tests
 *
 * Tests hero banner with character image, name, description, and favorite button.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterHero } from "./CharacterHero";

// Mock child components
jest.mock("@ui/designSystem/molecules/FavoriteButton/FavoriteButton", () => ({
  FavoriteButton: ({ onToggle, isFavorite }: any) => (
    <button onClick={onToggle} data-testid="favorite-button">
      {isFavorite ? "Favorited" : "Not Favorited"}
    </button>
  ),
}));

// Mock adaptive line clamp hook
jest.mock("@ui/hooks/useAdaptiveLineClamp", () => ({
  useAdaptiveLineClamp: () => 3,
}));

describe("CharacterHero", () => {
  /**
   * Default props for testing
   */
  const defaultProps = {
    imageUrl: "https://example.com/hero.jpg",
    characterName: "Spider-Man",
    isFavorite: false,
    onToggleFavorite: jest.fn(),
  };

  /**
   * Helper: Render component
   */
  const renderHero = (props = {}) => {
    return render(<CharacterHero {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render character name", () => {
      renderHero();

      expect(
        screen.getByRole("heading", { name: "Spider-Man" }),
      ).toBeInTheDocument();
    });

    it("should render character image", () => {
      renderHero();

      const image = screen.getByRole("img", { name: "Spider-Man" });
      expect(image).toHaveAttribute("src", "https://example.com/hero.jpg");
    });

    it("should render favorite button", () => {
      renderHero();

      expect(screen.getByTestId("favorite-button")).toBeInTheDocument();
    });

    it("should render without description", () => {
      renderHero({ description: undefined });

      expect(screen.queryByText(/READ MORE/i)).not.toBeInTheDocument();
    });

    it("should render with description", () => {
      renderHero({ description: "Spider-Man is a superhero." });

      expect(
        screen.getByText("Spider-Man is a superhero."),
      ).toBeInTheDocument();
    });
  });

  describe("Description expansion", () => {
    it("shows READ MORE button for long descriptions", () => {
      // Mock scrollHeight > clientHeight to simulate truncation
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        value: 100,
      });

      renderHero({
        description: "A very long description that will be truncated...",
      });

      expect(
        screen.getByRole("button", { name: /READ MORE/i }),
      ).toBeInTheDocument();
    });

    it("expands description when user clicks READ MORE", async () => {
      const user = userEvent.setup();
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        value: 100,
      });

      renderHero({ description: "Long description..." });

      const button = screen.getByRole("button", { name: /READ MORE/i });
      await user.click(button);

      expect(screen.getByRole("button", { name: /HIDE/i })).toBeInTheDocument();
    });

    it("collapses description when user clicks HIDE", async () => {
      const user = userEvent.setup();
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        value: 100,
      });

      renderHero({ description: "Long description..." });

      const readMoreButton = screen.getByRole("button", { name: /READ MORE/i });
      await user.click(readMoreButton);

      const hideButton = screen.getByRole("button", { name: /HIDE/i });
      await user.click(hideButton);

      expect(
        screen.getByRole("button", { name: /READ MORE/i }),
      ).toBeInTheDocument();
    });

    it("keeps button visible after expansion (regression test)", async () => {
      const user = userEvent.setup();
      // Mock scrollHeight > clientHeight to simulate truncation
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        value: 100,
      });

      renderHero({ description: "Long description that needs truncation..." });

      // Verify READ MORE button appears
      const readMoreButton = screen.getByRole("button", { name: /READ MORE/i });
      expect(readMoreButton).toBeInTheDocument();

      // Click to expand
      await user.click(readMoreButton);

      // CRITICAL: Button should still be visible after expansion (now showing HIDE)
      // This tests the fix where we added `if (isExpanded) return;`
      const hideButton = screen.getByRole("button", { name: /HIDE/i });
      expect(hideButton).toBeInTheDocument();
      expect(hideButton).toBeVisible();
    });

    it("should not show button for short descriptions that fit", () => {
      // Mock scrollHeight === clientHeight (no truncation)
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        value: 100,
      });
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        value: 100,
      });

      renderHero({ description: "Short description" });

      // Button should not appear when text fits
      expect(
        screen.queryByRole("button", { name: /READ MORE/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Favorite interaction", () => {
    it("calls onToggleFavorite when user clicks favorite button", async () => {
      const user = userEvent.setup();
      const mockToggle = jest.fn();
      renderHero({ onToggleFavorite: mockToggle });

      await user.click(screen.getByTestId("favorite-button"));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it("shows favorite state", () => {
      renderHero({ isFavorite: true });

      expect(screen.getByText("Favorited")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have heading for character name", () => {
      renderHero();

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("should have alt text for image", () => {
      renderHero({ characterName: "Iron Man" });

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "Iron Man");
    });

    it("should have aria-expanded on toggle button", () => {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        value: 100,
      });

      renderHero({ description: "Long description..." });

      const button = screen.getByRole("button", { name: /READ MORE/i });
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });
});
