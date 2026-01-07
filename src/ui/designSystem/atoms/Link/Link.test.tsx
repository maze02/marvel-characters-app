import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Link } from "./Link";

describe("Link", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe("Rendering", () => {
    it("renders internal link correctly", () => {
      renderWithRouter(<Link to="/test">Test Link</Link>);

      const linkElement = screen.getByText("Test Link");
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute("href", "/test");
    });

    it("renders external link correctly", () => {
      renderWithRouter(
        <Link to="https://example.com" external>
          External Link
        </Link>,
      );

      const linkElement = screen.getByText("External Link");
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute("href", "https://example.com");
      expect(linkElement).toHaveAttribute("target", "_blank");
      expect(linkElement).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders with default variant", () => {
      renderWithRouter(<Link to="/test">Test Link Text</Link>);

      const anchor = screen.getByRole("link", { name: "Test Link Text" });
      expect(anchor).toBeInTheDocument();
      expect(anchor).toHaveAttribute("href", "/test");
    });

    it("renders with secondary variant", () => {
      renderWithRouter(
        <Link to="/test" variant="secondary">
          Test Link Text
        </Link>,
      );

      const anchor = screen.getByRole("link", { name: "Test Link Text" });
      expect(anchor).toBeInTheDocument();
      expect(anchor).toHaveAttribute("href", "/test");
    });

    it("applies custom className", () => {
      renderWithRouter(
        <Link to="/test" className="custom-class">
          Link
        </Link>,
      );

      const linkElement = screen.getByText("Link");
      expect(linkElement.className).toContain("custom-class");
    });
  });

  describe("Accessibility", () => {
    it("is keyboard accessible", () => {
      renderWithRouter(<Link to="/test">Test Link</Link>);

      const linkElement = screen.getByText("Test Link");
      expect(linkElement).toBeVisible();

      // Links are naturally keyboard accessible
      linkElement.focus();
      expect(linkElement).toHaveFocus();
    });

    it("has proper ARIA attributes for external links", () => {
      renderWithRouter(
        <Link to="https://example.com" external>
          External
        </Link>,
      );

      const linkElement = screen.getByText("External");
      expect(linkElement).toHaveAttribute("rel", "noopener noreferrer");
      expect(linkElement).toHaveAttribute("target", "_blank");
    });
  });

  describe("Variants", () => {
    it("renders all variants without errors", () => {
      const { rerender } = renderWithRouter(
        <Link to="/test" variant="primary">
          Primary
        </Link>,
      );
      expect(screen.getByText("Primary")).toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <Link to="/test" variant="secondary">
            Secondary
          </Link>
        </MemoryRouter>,
      );
      expect(screen.getByText("Secondary")).toBeInTheDocument();
    });
  });

  describe("Props forwarding", () => {
    it("forwards additional props to internal links", () => {
      renderWithRouter(
        <Link to="/test" data-testid="custom-link">
          Link
        </Link>,
      );

      const linkElement = screen.getByTestId("custom-link");
      expect(linkElement).toBeInTheDocument();
    });

    it("forwards additional props to external links", () => {
      renderWithRouter(
        <Link to="https://example.com" external data-testid="external-link">
          External
        </Link>,
      );

      const linkElement = screen.getByTestId("external-link");
      expect(linkElement).toBeInTheDocument();
    });
  });
});
