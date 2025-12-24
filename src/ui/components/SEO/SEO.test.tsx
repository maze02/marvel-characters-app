/**
 * SEO Component Tests
 *
 * Tests for the SEO React component covering:
 * - Integration with SEOService via dependency injection
 * - Props handling and metadata updates
 * - Lifecycle management (mount/unmount)
 * - Structured data injection and cleanup
 *
 * Why these tests matter:
 * - Ensures SEO metadata updates when page changes
 * - Verifies proper cleanup (prevents memory leaks)
 * - Tests dependency injection works correctly
 */

import React from "react";
import { render } from "@testing-library/react";
import { SEO } from "./SEO";
import { DependenciesProvider } from "@ui/state";
import { DependencyContainer } from "@infrastructure/dependencies/DependencyContainer";
import { SEOService } from "@application/seo/ports/SEOService";
import { CharacterRepository } from "@domain/character/ports/CharacterRepository";
import { FavoritesRepository } from "@domain/character/ports/FavoritesRepository";

/**
 * Mock SEO Service
 *
 * Used for testing - tracks which methods were called and with what arguments
 */
class MockSEOService implements SEOService {
  updateMetadata = jest.fn();
  addStructuredData = jest.fn();
  removeStructuredData = jest.fn();
  reset = jest.fn();
}

/**
 * Mock Repositories
 *
 * Minimal mocks since SEO component doesn't use these directly
 */
const mockCharacterRepo = {} as CharacterRepository;
const mockFavoritesRepo = {} as FavoritesRepository;

describe("SEO Component", () => {
  let mockSEOService: MockSEOService;

  beforeEach(() => {
    // Fresh mock for each test
    mockSEOService = new MockSEOService();
    jest.clearAllMocks();
  });

  /**
   * Helper to render component with dependency injection
   * This simulates the real app context
   */
  const renderWithDI = (component: React.ReactElement) => {
    const container = DependencyContainer.createForTesting(
      mockCharacterRepo,
      mockFavoritesRepo,
      mockSEOService,
    );

    return render(
      <DependenciesProvider container={container}>
        {component}
      </DependenciesProvider>,
    );
  };

  describe("Metadata Updates", () => {
    /**
     * Basic render test
     * Should update metadata immediately on mount
     */
    it("should call updateMetadata on mount", () => {
      renderWithDI(<SEO title="Test Page" description="Test Description" />);

      expect(mockSEOService.updateMetadata).toHaveBeenCalledTimes(1);
      expect(mockSEOService.updateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Page",
          description: "Test Description",
        }),
      );
    });

    /**
     * Props update test
     * Should update metadata when props change (e.g., navigating to new page)
     */
    it("should update metadata when props change", () => {
      const { rerender } = renderWithDI(
        <SEO title="Initial Title" description="Initial description" />,
      );

      expect(mockSEOService.updateMetadata).toHaveBeenCalledTimes(1);

      // Simulate navigation to new page
      rerender(
        <DependenciesProvider
          container={DependencyContainer.createForTesting(
            mockCharacterRepo,
            mockFavoritesRepo,
            mockSEOService,
          )}
        >
          <SEO title="Updated Title" description="Updated description" />
        </DependenciesProvider>,
      );

      expect(mockSEOService.updateMetadata).toHaveBeenCalledTimes(2);
      expect(mockSEOService.updateMetadata).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: "Updated Title",
          description: "Updated description",
        }),
      );
    });

    /**
     * All props test
     * Should pass all metadata props to the service
     */
    it("should pass all metadata props to service", () => {
      const metadata = {
        title: "Spider-Man Character Page",
        description: "Learn about Spider-Man",
        image: "https://example.com/spiderman.jpg",
        type: "profile" as const,
        canonicalUrl: "https://example.com/character/spider-man",
        character: {
          name: "Spider-Man",
          description: "Friendly neighborhood Spider-Man",
          image: "https://example.com/hero.jpg",
        },
      };

      renderWithDI(<SEO {...metadata} />);

      expect(mockSEOService.updateMetadata).toHaveBeenCalledWith(metadata);
    });

    /**
     * Minimal props test
     * Only title and description are required
     */
    it("should work with minimal props", () => {
      renderWithDI(<SEO title="Simple" description="Simple page" />);

      expect(mockSEOService.updateMetadata).toHaveBeenCalledWith({
        title: "Simple",
        description: "Simple page",
      });
    });

    /**
     * Optional props test
     * Should only include provided optional props
     */
    it("should handle optional props correctly", () => {
      renderWithDI(
        <SEO
          title="Test"
          description="Test"
          image="https://example.com/image.jpg"
        />,
      );

      expect(mockSEOService.updateMetadata).toHaveBeenCalledWith({
        title: "Test",
        description: "Test",
        image: "https://example.com/image.jpg",
      });
    });
  });

  describe("Structured Data", () => {
    /**
     * Add structured data test
     * Should add structured data when provided
     */
    it("should add structured data when provided", () => {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Marvel App",
      };

      renderWithDI(
        <SEO title="Test" description="Test" structuredData={structuredData} />,
      );

      expect(mockSEOService.addStructuredData).toHaveBeenCalledWith(
        structuredData,
        "additional-structured-data",
      );
    });

    /**
     * No structured data test
     * Should not call addStructuredData if not provided
     */
    it("should not add structured data when not provided", () => {
      renderWithDI(<SEO title="Test" description="Test" />);

      expect(mockSEOService.addStructuredData).not.toHaveBeenCalled();
    });

    /**
     * Remove structured data on unmount test
     * Important for cleanup when navigating away
     */
    it("should remove structured data on unmount", () => {
      const { unmount } = renderWithDI(
        <SEO
          title="Test"
          description="Test"
          structuredData={{ test: "data" }}
        />,
      );

      expect(mockSEOService.addStructuredData).toHaveBeenCalled();

      unmount();

      expect(mockSEOService.removeStructuredData).toHaveBeenCalledWith(
        "additional-structured-data",
      );
    });

    /**
     * No cleanup without structured data test
     * Should not try to remove if never added
     */
    it("should not remove structured data if never added", () => {
      const { unmount } = renderWithDI(<SEO title="Test" description="Test" />);

      unmount();

      expect(mockSEOService.removeStructuredData).not.toHaveBeenCalled();
    });

    /**
     * Update structured data test
     * Should update when structured data prop changes
     */
    it("should update structured data when it changes", () => {
      const structuredData1 = { version: 1 };
      const structuredData2 = { version: 2 };

      const { rerender } = renderWithDI(
        <SEO
          title="Test"
          description="Test"
          structuredData={structuredData1}
        />,
      );

      expect(mockSEOService.addStructuredData).toHaveBeenCalledWith(
        structuredData1,
        "additional-structured-data",
      );

      rerender(
        <DependenciesProvider
          container={DependencyContainer.createForTesting(
            mockCharacterRepo,
            mockFavoritesRepo,
            mockSEOService,
          )}
        >
          <SEO
            title="Test"
            description="Test"
            structuredData={structuredData2}
          />
        </DependenciesProvider>,
      );

      expect(mockSEOService.addStructuredData).toHaveBeenCalledWith(
        structuredData2,
        "additional-structured-data",
      );
    });
  });

  describe("Rendering", () => {
    /**
     * No visual output test
     * SEO component should render nothing visible
     */
    it("should render nothing (null)", () => {
      const { container } = renderWithDI(
        <SEO title="Test" description="Test" />,
      );

      expect(container.firstChild).toBeNull();
    });

    /**
     * No DOM elements test
     * Should not add any elements to the DOM
     */
    it("should not add any elements to the container", () => {
      const { container } = renderWithDI(
        <SEO
          title="Test"
          description="Test"
          structuredData={{ test: "data" }}
        />,
      );

      expect(container.childNodes.length).toBe(0);
    });
  });

  describe("Dependency Injection", () => {
    /**
     * Uses injected service test
     * Verifies component gets service from DI container
     */
    it("should use SEO service from DI container", () => {
      renderWithDI(<SEO title="Test" description="Test" />);

      // If this is called, DI worked
      expect(mockSEOService.updateMetadata).toHaveBeenCalled();
    });

    /**
     * Error without provider test
     * Should throw helpful error if used outside provider
     */
    it("should throw error if used without DependenciesProvider", () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        render(<SEO title="Test" description="Test" />);
      }).toThrow();

      consoleError.mockRestore();
    });
  });

  describe("Character Metadata", () => {
    /**
     * Character data test
     * Should pass character info to service
     */
    it("should handle character metadata", () => {
      const character = {
        name: "Thor",
        description: "God of Thunder",
        image: "https://example.com/thor.jpg",
      };

      renderWithDI(
        <SEO title="Thor" description="Thor page" character={character} />,
      );

      expect(mockSEOService.updateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          character,
        }),
      );
    });

    /**
     * Character without description test
     * Should handle character with partial data
     */
    it("should handle character without description", () => {
      const character = {
        name: "Hulk",
        image: "https://example.com/hulk.jpg",
      };

      renderWithDI(
        <SEO title="Hulk" description="Hulk page" character={character} />,
      );

      expect(mockSEOService.updateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          character,
        }),
      );
    });
  });

  describe("Edge Cases", () => {
    /**
     * Empty strings test
     * Should handle empty strings gracefully
     */
    it("should handle empty strings", () => {
      expect(() => {
        renderWithDI(<SEO title="" description="" />);
      }).not.toThrow();

      expect(mockSEOService.updateMetadata).toHaveBeenCalled();
    });

    /**
     * Special characters test
     * Should pass special characters without issue
     */
    it("should handle special characters", () => {
      renderWithDI(
        <SEO
          title='Spider-Man & Iron Man: "Team Up"'
          description="Heroes <unite> for 'great' justice"
        />,
      );

      expect(mockSEOService.updateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Spider-Man & Iron Man: "Team Up"',
          description: "Heroes <unite> for 'great' justice",
        }),
      );
    });

    /**
     * Very long content test
     * Should handle long descriptions
     */
    it("should handle very long metadata", () => {
      const longDescription = "A".repeat(500);

      renderWithDI(<SEO title="Test" description={longDescription} />);

      expect(mockSEOService.updateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          description: longDescription,
        }),
      );
    });

    /**
     * Rapid re-renders test
     * Should handle multiple quick updates
     */
    it("should handle rapid prop changes", () => {
      const { rerender } = renderWithDI(
        <SEO title="Title 1" description="Desc 1" />,
      );

      const container = DependencyContainer.createForTesting(
        mockCharacterRepo,
        mockFavoritesRepo,
        mockSEOService,
      );

      // Rapid updates (simulating fast navigation)
      for (let i = 2; i <= 5; i++) {
        rerender(
          <DependenciesProvider container={container}>
            <SEO title={`Title ${i}`} description={`Desc ${i}`} />
          </DependenciesProvider>,
        );
      }

      expect(mockSEOService.updateMetadata).toHaveBeenCalledTimes(5);
    });
  });
});
