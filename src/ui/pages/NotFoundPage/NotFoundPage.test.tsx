/**
 * NotFoundPage Tests
 *
 * Unit tests for 404 error page.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotFoundPage } from "./NotFoundPage";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock SEO component
jest.mock("@ui/components/SEO", () => ({
  SEO: () => null,
}));

// Mock dependencies context
jest.mock("@ui/state/DependenciesContext", () => ({
  useServices: jest.fn(() => ({
    seo: {
      updateMetadata: jest.fn(),
      addStructuredData: jest.fn(),
      removeStructuredData: jest.fn(),
      reset: jest.fn(),
    },
  })),
}));

describe("NotFoundPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
  };

  describe("Rendering", () => {
    it("renders 404 error code", () => {
      renderComponent();
      expect(screen.getByLabelText(/error 404/i)).toBeInTheDocument();
      expect(screen.getByText("404")).toBeInTheDocument();
    });

    it("renders page title", () => {
      renderComponent();
      expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    });

    it("renders descriptive message", () => {
      renderComponent();
      expect(
        screen.getByText(/the page you're looking for doesn't exist/i),
      ).toBeInTheDocument();
    });

    it("renders action buttons", () => {
      renderComponent();
      expect(
        screen.getByRole("button", { name: /go to home page/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go back to previous page/i }),
      ).toBeInTheDocument();
    });

    it("renders helpful navigation links", () => {
      renderComponent();
      expect(screen.getByText(/you might be looking for/i)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /browse all characters/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /view your favorites/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigates to home page when 'Go to Home' button is clicked", () => {
      renderComponent();
      const homeButton = screen.getByRole("button", {
        name: /go to home page/i,
      });
      fireEvent.click(homeButton);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("navigates back when 'Go Back' button is clicked with history", () => {
      // Mock window.history.length to simulate browser history
      Object.defineProperty(window, "history", {
        value: { length: 5 },
        writable: true,
      });

      renderComponent();
      const backButton = screen.getByRole("button", {
        name: /go back to previous page/i,
      });
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("navigates to home when 'Go Back' button is clicked without history", () => {
      // Mock window.history.length to simulate no browser history
      Object.defineProperty(window, "history", {
        value: { length: 1 },
        writable: true,
      });

      renderComponent();
      const backButton = screen.getByRole("button", {
        name: /go back to previous page/i,
      });
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("renders link to home page", () => {
      renderComponent();
      const homeLink = screen.getByRole("link", {
        name: /browse all characters/i,
      });
      expect(homeLink).toHaveAttribute("href", "/");
    });

    it("renders link to favorites page", () => {
      renderComponent();
      const favoritesLink = screen.getByRole("link", {
        name: /view your favorites/i,
      });
      expect(favoritesLink).toHaveAttribute("href", "/favorites");
    });
  });

  describe("Accessibility", () => {
    it("has main-content landmark", () => {
      renderComponent();
      expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    });

    it("has proper heading hierarchy", () => {
      renderComponent();
      const h1 = screen.getByLabelText(/error 404/i);
      const h2 = screen.getByText(/page not found/i);
      expect(h1.tagName).toBe("H1");
      expect(h2.tagName).toBe("H2");
    });

    it("has navigation landmark for helpful links", () => {
      renderComponent();
      expect(
        screen.getByRole("navigation", { name: /helpful navigation links/i }),
      ).toBeInTheDocument();
    });

    it("buttons have descriptive aria-labels", () => {
      renderComponent();
      expect(
        screen.getByRole("button", { name: /go to home page/i }),
      ).toHaveAttribute("aria-label", "Go to home page");
      expect(
        screen.getByRole("button", { name: /go back to previous page/i }),
      ).toHaveAttribute("aria-label", "Go back to previous page");
    });
  });

  describe("Styling", () => {
    it("has main content container with proper id", () => {
      renderComponent();
      const mainElement = screen.getByRole("main");
      expect(mainElement).toHaveAttribute("id", "main-content");
    });
  });
});
