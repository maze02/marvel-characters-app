/**
 * Input Tests
 *
 * Comprehensive tests for Input component covering rendering, labels,
 * errors, helper text, icons, user interactions, and accessibility.
 */

import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  describe("Rendering", () => {
    it("should render input element", () => {
      render(<Input />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with placeholder", () => {
      render(<Input placeholder="Enter text..." />);

      expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
    });

    it("should render with default value", () => {
      render(<Input defaultValue="Initial value" />);

      expect(screen.getByRole("textbox")).toHaveValue("Initial value");
    });

    it("should render with controlled value", () => {
      render(<Input value="Controlled" onChange={() => {}} />);

      expect(screen.getByRole("textbox")).toHaveValue("Controlled");
    });

    it("should render with custom className", () => {
      const { container } = render(<Input className="custom-class" />);

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Label", () => {
    it("should render with label", () => {
      render(<Input label="Username" />);

      expect(screen.getByLabelText("Username")).toBeInTheDocument();
    });

    it("should associate label with input via htmlFor", () => {
      render(<Input label="Email" id="email-input" />);

      const label = screen.getByText("Email");
      const input = screen.getByRole("textbox");

      expect(label).toHaveAttribute("for", "email-input");
      expect(input).toHaveAttribute("id", "email-input");
    });
  });

  describe("Error state", () => {
    it("should render error message", () => {
      render(<Input error="This field is required" />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "This field is required",
      );
    });

    it("should set aria-invalid when error exists", () => {
      render(<Input error="Invalid input" />);

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("should not show error by default", () => {
      render(<Input />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
    });
  });

  describe("Helper text", () => {
    it("should render helper text", () => {
      render(<Input helperText="Enter your email address" />);

      expect(screen.getByText("Enter your email address")).toBeInTheDocument();
    });

    it("should hide helper text when error is shown", () => {
      render(<Input error="Error message" helperText="Helper text" />);

      expect(screen.getByRole("alert")).toHaveTextContent("Error message");
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    });
  });

  describe("Icon", () => {
    it("should render with icon", () => {
      const icon = <span data-testid="search-icon">🔍</span>;
      render(<Input icon={icon} />);

      expect(screen.getByTestId("search-icon")).toBeInTheDocument();
    });
  });

  describe("User interactions", () => {
    it("should call onChange when user types", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole("textbox"), "Hello");

      expect(handleChange).toHaveBeenCalled();
      expect(screen.getByRole("textbox")).toHaveValue("Hello");
    });

    it("should call onFocus when input is focused", () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);

      fireEvent.focus(screen.getByRole("textbox"));

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("should call onBlur when input loses focus", () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("Disabled state", () => {
    it("should not be disabled by default", () => {
      render(<Input />);

      expect(screen.getByRole("textbox")).not.toBeDisabled();
    });

    it("should be disabled when prop is true", () => {
      render(<Input disabled />);

      expect(screen.getByRole("textbox")).toBeDisabled();
    });
  });

  describe("Input types", () => {
    it("should render as textbox by default", () => {
      render(<Input />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should support email type", () => {
      render(<Input type="email" />);

      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("should support search type", () => {
      render(<Input type="search" />);

      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should support number type", () => {
      render(<Input type="number" />);

      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });
  });

  describe("HTML input attributes", () => {
    it("should support required attribute", () => {
      render(<Input required />);

      expect(screen.getByRole("textbox")).toBeRequired();
    });

    it("should support readonly attribute", () => {
      render(<Input readOnly />);

      expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    });

    it("should support maxLength attribute", () => {
      render(<Input maxLength={100} />);

      expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "100");
    });

    it("should support name attribute", () => {
      render(<Input name="username" />);

      expect(screen.getByRole("textbox")).toHaveAttribute("name", "username");
    });
  });

  describe("Ref forwarding", () => {
    it("should forward ref to input element", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe("INPUT");
    });

    it("should allow ref to be used for focus", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      ref.current?.focus();

      expect(ref.current).toHaveFocus();
    });

    it("should allow ref to be used for value access", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} defaultValue="test" />);

      expect(ref.current?.value).toBe("test");
    });
  });

  describe("Accessibility", () => {
    it("should be keyboard focusable", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      input.focus();

      expect(input).toHaveFocus();
    });

    it("should announce errors to screen readers", () => {
      render(<Input error="Error message" />);

      const errorElement = screen.getByRole("alert");
      expect(errorElement).toBeInTheDocument();
    });

    it("should have proper label association", () => {
      render(<Input label="Search" id="search" />);

      const input = screen.getByLabelText("Search");
      expect(input).toHaveAttribute("id", "search");
    });
  });
});
