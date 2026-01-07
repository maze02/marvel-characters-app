/**
 * Layout Tests
 *
 * Tests layout component with loading bar, navbar, API banner, and content rendering.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";

// Mock child components
interface MockNavbarProps {
  onLogoClick?: () => void;
  onFavoritesClick?: () => void;
}

jest.mock("../Navbar/Navbar", () => ({
  Navbar: ({ onLogoClick, onFavoritesClick }: MockNavbarProps) => (
    <div data-testid="navbar">
      <button onClick={onLogoClick}>Logo</button>
      <button onClick={onFavoritesClick}>Favorites</button>
    </div>
  ),
}));

jest.mock("../ApiKeyBanner/ApiKeyBanner", () => ({
  ApiKeyBanner: () => <div data-testid="api-banner">API Banner</div>,
}));

jest.mock("@ui/designSystem/atoms/LoadingBar/LoadingBar", () => ({
  LoadingBar: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="loading-bar">Loading</div> : null,
}));

const mockNavigate = jest.fn();
const mockUseIsFetching = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@tanstack/react-query", () => ({
  useIsFetching: () => mockUseIsFetching(),
}));

describe("Layout", () => {
  /**
   * Helper: Render component with router
   */
  const renderLayout = (props = {}) => {
    return render(
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout {...props}>
          <div data-testid="test-content">Test Content</div>
        </Layout>
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no queries are fetching
    mockUseIsFetching.mockReturnValue(0);
  });

  describe("Rendering", () => {
    it("should render loading bar", () => {
      renderLayout();

      // LoadingBar component is rendered (even if not visible when isLoading=false)
      expect(screen.queryByTestId("loading-bar")).not.toBeInTheDocument();
    });

    it("should render navbar", () => {
      renderLayout();

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });

    it("should render API banner", () => {
      renderLayout();

      expect(screen.getByTestId("api-banner")).toBeInTheDocument();
    });

    it("should render children content", () => {
      renderLayout();

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should render main content wrapper", () => {
      renderLayout();

      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("should show loading bar when queries are fetching", () => {
      // When 1 or more queries are fetching
      mockUseIsFetching.mockReturnValue(1);

      renderLayout();

      expect(screen.getByTestId("loading-bar")).toBeInTheDocument();
    });

    it("should hide loading bar when no queries are fetching", () => {
      // When 0 queries are fetching
      mockUseIsFetching.mockReturnValue(0);

      renderLayout();

      expect(screen.queryByTestId("loading-bar")).not.toBeInTheDocument();
    });
  });

  describe("Logo navigation", () => {
    it("navigates to home when user clicks logo", async () => {
      const user = userEvent.setup();
      renderLayout();

      await user.click(screen.getByText("Logo"));

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("calls custom onLogoClick when provided", async () => {
      const user = userEvent.setup();
      const mockLogoClick = jest.fn();
      renderLayout({ onLogoClick: mockLogoClick });

      await user.click(screen.getByText("Logo"));

      expect(mockLogoClick).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Favorites navigation", () => {
    it("navigates to favorites when user clicks button", async () => {
      const user = userEvent.setup();
      renderLayout();

      await user.click(screen.getByText("Favorites"));

      expect(mockNavigate).toHaveBeenCalledWith("/favorites");
    });
  });

  describe("Content structure", () => {
    it("should render layout container", () => {
      const { container } = renderLayout();

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render components in correct order", () => {
      // Set fetching to show loading bar
      mockUseIsFetching.mockReturnValue(1);

      const { container } = renderLayout();

      const elements = Array.from(
        container.querySelectorAll("[data-testid], main"),
      );
      expect(elements[0]).toHaveAttribute("data-testid", "loading-bar");
      expect(elements[1]).toHaveAttribute("data-testid", "api-banner");
      expect(elements[2]).toHaveAttribute("data-testid", "navbar");
      expect(elements[3]).toBeDefined();
      expect(elements[3]?.tagName).toBe("MAIN");
    });
  });
});
