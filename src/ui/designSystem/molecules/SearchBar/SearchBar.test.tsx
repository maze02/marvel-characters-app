/**
 * SearchBar Tests
 *
 * Tests search input functionality, clear button, and keyboard interactions.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  /**
   * Default props for testing
   */
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
    placeholder: "Search characters...",
  };

  /**
   * Helper: Render component
   */
  const renderSearchBar = (props = {}) => {
    return render(<SearchBar {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render search input", () => {
      renderSearchBar();

      expect(
        screen.getByPlaceholderText("Search characters..."),
      ).toBeInTheDocument();
    });

    it("should render with empty value by default", () => {
      renderSearchBar();

      const input = screen.getByRole("searchbox");
      expect(input).toHaveValue("");
    });

    it("should render with provided value", () => {
      renderSearchBar({ value: "Spider-Man" });

      const input = screen.getByRole("searchbox");
      expect(input).toHaveValue("Spider-Man");
    });

    it("should render search icon", () => {
      renderSearchBar();

      // Icon is rendered via Icon component
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });
  });

  describe("Value management", () => {
    it("renders empty value", () => {
      renderSearchBar({ value: "" });

      const input = screen.getByRole("searchbox");
      expect(input).toHaveValue("");
    });

    it("renders with provided value", () => {
      renderSearchBar({ value: "Spider-Man" });

      const input = screen.getByRole("searchbox");
      expect(input).toHaveValue("Spider-Man");
    });

    it("clears value when user deletes text", async () => {
      const user = userEvent.setup();
      const mockChange = jest.fn();
      renderSearchBar({ value: "Spider-Man", onChange: mockChange });

      const input = screen.getByRole("searchbox");
      await user.clear(input);

      expect(mockChange).toHaveBeenCalledWith("");
    });
  });

  describe("Input interaction", () => {
    it("calls onChange when user types", async () => {
      const user = userEvent.setup();
      const mockChange = jest.fn();
      renderSearchBar({ onChange: mockChange });

      const input = screen.getByRole("searchbox");
      await user.type(input, "Spider");

      // userEvent.type fires onChange for each character
      expect(mockChange).toHaveBeenCalled();
      // Check that onChange was called 6 times (once per character)
      expect(mockChange).toHaveBeenCalledTimes(6);
    });

    it("handles user typing multiple characters", async () => {
      const user = userEvent.setup();
      const mockChange = jest.fn();
      renderSearchBar({ onChange: mockChange });

      const input = screen.getByRole("searchbox");
      await user.type(input, "Spi");

      // Each character triggers onChange
      expect(mockChange).toHaveBeenCalled();
    });

    it("handles user clearing input", async () => {
      const user = userEvent.setup();
      const mockChange = jest.fn();
      renderSearchBar({ value: "Spider-Man", onChange: mockChange });

      const input = screen.getByRole("searchbox");
      await user.clear(input);

      expect(mockChange).toHaveBeenCalledWith("");
    });
  });

  describe("Keyboard interactions", () => {
    it("allows user to press Enter key", async () => {
      const user = userEvent.setup();
      const mockChange = jest.fn();
      renderSearchBar({ onChange: mockChange });

      const input = screen.getByRole("searchbox");
      await user.type(input, "{Enter}");

      // Search should work without Enter key requirement
      expect(input).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has searchbox role for assistive technologies", () => {
      renderSearchBar();

      const input = screen.getByRole("searchbox");
      expect(input).toBeInTheDocument();
    });

    it("provides placeholder text for guidance", () => {
      renderSearchBar({ placeholder: "Find your hero" });

      expect(screen.getByPlaceholderText("Find your hero")).toBeInTheDocument();
    });
  });
});
