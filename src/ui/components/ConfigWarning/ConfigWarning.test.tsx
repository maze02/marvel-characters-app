/**
 * ConfigWarning Tests
 *
 * Tests configuration warning display for missing API keys.
 */

import { render, screen } from "@testing-library/react";
import { ConfigWarning } from "./ConfigWarning";

// Mock config
jest.mock("@infrastructure/config/env", () => ({
  config: {
    isConfigured: false,
  },
}));

describe("ConfigWarning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render warning when API not configured", () => {
      render(<ConfigWarning />);

      expect(screen.getByText(/Marvel API Keys Required/i)).toBeInTheDocument();
    });

    it("should render warning icon", () => {
      render(<ConfigWarning />);

      expect(screen.getByText(/⚠️/)).toBeInTheDocument();
    });

    it("should render instructions", () => {
      render(<ConfigWarning />);

      expect(screen.getByText(/To use this application/i)).toBeInTheDocument();
    });

    it("should render setup steps", () => {
      render(<ConfigWarning />);

      expect(screen.getByText(/Marvel Developer Portal/i)).toBeInTheDocument();
      expect(screen.getByText(/Open the/i)).toBeInTheDocument();
      expect(screen.getByText(/Save the file/i)).toBeInTheDocument();
    });

    it("should render example configuration", () => {
      render(<ConfigWarning />);

      expect(
        screen.getByText(/Your .env file should look like:/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/VITE_MARVEL_PUBLIC_KEY/)).toBeInTheDocument();
      expect(screen.getByText(/VITE_MARVEL_PRIVATE_KEY/)).toBeInTheDocument();
    });

    it("should render developer portal link", () => {
      render(<ConfigWarning />);

      const link = screen.getByRole("link", {
        name: /Marvel Developer Portal/i,
      });
      expect(link).toHaveAttribute(
        "href",
        "https://developer.marvel.com/account",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Conditional rendering", () => {
    it("should not render when API is configured", () => {
      const envModule = jest.requireMock("@infrastructure/config/env");
      envModule.config.isConfigured = true;

      const { container } = render(<ConfigWarning />);

      expect(container.firstChild).toBeNull();
    });

    it("should render when API is not configured", () => {
      const envModule = jest.requireMock("@infrastructure/config/env");
      envModule.config.isConfigured = false;

      render(<ConfigWarning />);

      expect(screen.getByText(/Marvel API Keys Required/i)).toBeInTheDocument();
    });
  });

  describe("Content structure", () => {
    it("should render heading", () => {
      render(<ConfigWarning />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("should render ordered list for steps", () => {
      const { container } = render(<ConfigWarning />);

      const orderedList = container.querySelector("ol");
      expect(orderedList).toBeInTheDocument();
    });

    it("should render code examples", () => {
      const { container } = render(<ConfigWarning />);

      const codeElements = container.querySelectorAll("code, pre");
      expect(codeElements.length).toBeGreaterThan(0);
    });
  });

  describe("Instructions clarity", () => {
    it("should mention .env file", () => {
      render(<ConfigWarning />);

      // Multiple elements contain .env, so check that at least one exists
      const envMentions = screen.getAllByText(/\.env/i);
      expect(envMentions.length).toBeGreaterThan(0);
    });

    it("should mention refresh requirement", () => {
      render(<ConfigWarning />);

      expect(screen.getByText(/refresh this page/i)).toBeInTheDocument();
    });
  });
});
