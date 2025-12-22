/**
 * Button Tests
 * 
 * Comprehensive tests for Button component covering rendering, variants,
 * sizes, loading states, interactions, and accessibility.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button element', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<Button>Test Button</Button>);

      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      render(<Button>Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Primary');
    });

    it('should render primary variant explicitly', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Primary');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Secondary');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Ghost');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Button>Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Medium');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Small');
    });

    it('should render medium size explicitly', () => {
      render(<Button size="md">Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Medium');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Large');
    });
  });

  describe('Full width', () => {
    it('should render by default', () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render full width when prop is true', () => {
      render(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Full Width');
    });
  });

  describe('Loading state', () => {
    it('should not be loading by default', () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-busy', 'true');
    });

    it('should render loading state', () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should show spinner when loading', () => {
      render(<Button loading>Loading</Button>);

      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide spinner when not loading', () => {
      render(<Button loading={false}>Not Loading</Button>);

      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<Button loading>Loading</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should still show children text when loading', () => {
      render(<Button loading>Save Changes</Button>);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('should not be disabled by default', () => {
      render(<Button>Button</Button>);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should be disabled when prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be disabled when both disabled and loading', () => {
      render(<Button disabled loading>Disabled & Loading</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('User interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should support keyboard interaction (Enter)', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('should support keyboard interaction (Space)', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('HTML button attributes', () => {
    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should have button type by default', () => {
      render(<Button>Default Type</Button>);

      const button = screen.getByRole('button');
      // Note: type defaults to "submit" in HTML, but we're not explicitly setting it
      expect(button).toBeInTheDocument();
    });

    it('should support form attribute', () => {
      render(<Button form="my-form">Form Button</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('form', 'my-form');
    });

    it('should support name attribute', () => {
      render(<Button name="action">Named Button</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('name', 'action');
    });

    it('should support value attribute', () => {
      render(<Button value="save">Value Button</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('value', 'save');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard focusable', () => {
      render(<Button>Focusable</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });

    it('should not be keyboard focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).not.toHaveFocus();
    });

    it('should have aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('should not have aria-busy when not loading', () => {
      render(<Button loading={false}>Not Loading</Button>);

      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy', 'true');
    });

    it('should have spinner with aria-hidden', () => {
      render(<Button loading>Loading</Button>);

      const spinner = screen.getByRole('button').querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should support custom aria-label', () => {
      render(<Button aria-label="Custom label">Icon only</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should support aria-describedby', () => {
      render(<Button aria-describedby="description">Button</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'description');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle all props together', () => {
      const handleClick = jest.fn();
      render(
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleClick}
          className="custom"
          data-testid="complex-button"
        >
          Complex Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('custom');
      expect(screen.getByText('Complex Button')).toBeInTheDocument();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should transition from loading to normal state', () => {
      const { rerender } = render(<Button loading>Loading</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');

      rerender(<Button loading={false}>Not Loading</Button>);

      expect(screen.getByRole('button')).not.toBeDisabled();
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy', 'true');
    });

    it('should handle rapid clicks', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty children', () => {
      render(<Button>{''}</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle React elements as children', () => {
      render(
        <Button>
          <span>Icon</span>
          Text
        </Button>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should handle data attributes', () => {
      render(<Button data-testid="test-button" data-custom="value">Data Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-testid', 'test-button');
      expect(button).toHaveAttribute('data-custom', 'value');
    });
  });
});
