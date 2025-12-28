/**
 * Navbar Tests
 *
 * Tests navbar with logo, favorites button, and badge display.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { Navbar } from "./Navbar";

// Mock dependencies
jest.mock("@ui/state/FavoritesContext", () => ({
  useFavorites: () => ({
    favoritesCount: 5,
  }),
}));

jest.mock("@ui/designSystem/atoms/Logo/Logo", () => ({
  Logo: ({ onClick }: any) => (
    <button onClick={onClick} data-testid="logo">
      Logo
    </button>
  ),
}));

jest.mock("@ui/designSystem/atoms/Icon/Icon", () => ({
  Icon: () => <span data-testid="heart-icon">Heart</span>,
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/" }),
}));

describe("Navbar", () => {
  /**
   * Helper: Render component with router
   */
  const renderNavbar = (props = {}) => {
    return render(
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar {...props} />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render logo", () => {
      renderNavbar();

      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });

    it("should render favorites button", () => {
      renderNavbar();

      const button = screen.getByLabelText(/favorites/i);
      expect(button).toBeInTheDocument();
    });

    it("should render favorites icon", () => {
      renderNavbar();

      expect(screen.getByTestId("heart-icon")).toBeInTheDocument();
    });

    it("should render as header element", () => {
      const { container } = renderNavbar();

      expect(container.querySelector("header")).toBeInTheDocument();
    });
  });

  describe("Favorites badge", () => {
    it("should show favorites count when greater than zero", () => {
      renderNavbar();

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should display favorites count from context", () => {
      renderNavbar();

      // Badge should show count from mock (5)
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should display correct count", () => {
      renderNavbar();

      // Using the default mock which returns 5
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("allows user to navigate to favorites when button clicked", async () => {
      const user = userEvent.setup();
      renderNavbar();

      const favoritesButton = screen.getByLabelText(/view favorites/i);
      await user.click(favoritesButton);

      expect(mockNavigate).toHaveBeenCalledWith("/favorites");
    });

    it("calls custom onFavoritesClick when provided", async () => {
      const user = userEvent.setup();
      const mockFavoritesClick = jest.fn();
      renderNavbar({ onFavoritesClick: mockFavoritesClick });

      const favoritesButton = screen.getByLabelText(/view favorites/i);
      await user.click(favoritesButton);

      expect(mockFavoritesClick).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("calls onLogoClick when user clicks logo", async () => {
      const user = userEvent.setup();
      const mockLogoClick = jest.fn();
      renderNavbar({ onLogoClick: mockLogoClick });

      const logo = screen.getByTestId("logo");
      await user.click(logo);

      expect(mockLogoClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have descriptive aria-label for favorites button", () => {
      renderNavbar();

      const button = screen.getByLabelText(/view favorites/i);
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label");
    });

    it("should have button type", () => {
      renderNavbar();

      const button = screen.getByLabelText(/view favorites/i);
      expect(button).toHaveAttribute("type", "button");
    });

    it("should have accessible button role", () => {
      renderNavbar();

      const button = screen.getByLabelText(/view favorites/i);
      expect(button.tagName).toBe("BUTTON");
    });
  });
});
