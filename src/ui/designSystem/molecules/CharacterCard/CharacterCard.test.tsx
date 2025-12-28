/**
 * CharacterCard Tests
 *
 * Tests character card rendering, navigation, and favorite interactions.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { CharacterCard } from "./CharacterCard";

// Mock child components
interface MockFavoriteButtonProps {
  onToggle: (e: React.MouseEvent) => void;
  isFavorite: boolean;
  characterName?: string;
}

jest.mock("../FavoriteButton/FavoriteButton", () => ({
  FavoriteButton: ({
    onToggle,
    isFavorite,
    characterName,
  }: MockFavoriteButtonProps) => (
    <button
      onClick={onToggle}
      data-testid="favorite-button"
      aria-label={`${isFavorite ? "Remove" : "Add"} ${characterName} to favorites`}
    >
      {isFavorite ? "Favorited" : "Not Favorited"}
    </button>
  ),
}));

describe("CharacterCard", () => {
  /**
   * Default props for testing
   */
  const defaultProps = {
    id: 123,
    name: "Spider-Man",
    imageUrl: "https://example.com/spiderman.jpg",
    isFavorite: false,
    onToggleFavorite: jest.fn(),
  };

  /**
   * Helper: Render component with router
   */
  const renderCard = (props = {}) => {
    return render(
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <CharacterCard {...defaultProps} {...props} />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render character name", () => {
      renderCard();

      expect(screen.getByText("Spider-Man")).toBeInTheDocument();
    });

    it("should render character image with correct src", () => {
      renderCard();

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", "https://example.com/spiderman.jpg");
    });

    it("should render image with lazy loading", () => {
      renderCard();

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("loading", "lazy");
    });

    it("should render as article element", () => {
      const { container } = renderCard();

      expect(container.querySelector("article")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should render link to character detail page", () => {
      renderCard();

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/character/123");
    });

    it("should render correct link for different character IDs", () => {
      renderCard({ id: 456 });

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/character/456");
    });
  });

  describe("Favorite functionality", () => {
    it("renders favorite button", () => {
      renderCard();

      expect(screen.getByTestId("favorite-button")).toBeInTheDocument();
    });

    it("shows not favorited state by default", () => {
      renderCard({ isFavorite: false });

      expect(screen.getByText("Not Favorited")).toBeInTheDocument();
    });

    it("shows favorited state when isFavorite is true", () => {
      renderCard({ isFavorite: true });

      expect(screen.getByText("Favorited")).toBeInTheDocument();
    });

    it("calls onToggleFavorite when user clicks favorite button", async () => {
      const user = userEvent.setup();
      const mockToggle = jest.fn();
      renderCard({ onToggleFavorite: mockToggle });

      await user.click(screen.getByTestId("favorite-button"));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it("includes character name in favorite button aria-label", () => {
      renderCard({ name: "Iron Man" });

      const button = screen.getByTestId("favorite-button");
      expect(button).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Iron Man"),
      );
    });
  });

  describe("Accessibility", () => {
    it("should have descriptive heading for character name", () => {
      renderCard();

      const heading = screen.getByRole("heading", { name: "Spider-Man" });
      expect(heading).toBeInTheDocument();
    });

    it("should have empty alt text for decorative image", () => {
      renderCard();

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "");
    });
  });
});
