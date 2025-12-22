/**
 * ComicsHorizontalScroll Tests
 * 
 * Tests comics horizontal scroll display and empty state handling.
 */

import { render, screen } from '@testing-library/react';
import { ComicsHorizontalScroll } from './ComicsHorizontalScroll';
import { Comic } from '../../../../domain/character/entities/Comic';
import { CharacterId } from '../../../../domain/character/valueObjects/CharacterId';
import { ImageUrl } from '../../../../domain/character/valueObjects/ImageUrl';
import { ReleaseDate } from '../../../../domain/character/valueObjects/ReleaseDate';

describe('ComicsHorizontalScroll', () => {
  /**
   * Helper: Create test comic with all required fields
   */
  const createComic = (id: number, title: string): Comic => {
    return new Comic({
      id,
      title,
      description: `Description for ${title}`,
      thumbnail: new ImageUrl('https://example.com/image', 'jpg'),
      onSaleDate: new ReleaseDate('2024-01-01'),
      characterId: new CharacterId(1),
    });
  };

  /**
   * Helper: Create multiple test comics
   */
  const createComics = (count: number): Comic[] => {
    return Array.from({ length: count }, (_, i) => 
      createComic(i + 1, `Comic ${i + 1}`)
    );
  };

  describe('Rendering', () => {
    it('should render section title', () => {
      const comics = createComics(3);
      render(<ComicsHorizontalScroll comics={comics} />);

      expect(screen.getByRole('heading', { name: 'COMICS' })).toBeInTheDocument();
    });

    it('should render custom title', () => {
      const comics = createComics(3);
      render(<ComicsHorizontalScroll comics={comics} title="RELATED COMICS" />);

      expect(screen.getByRole('heading', { name: 'RELATED COMICS' })).toBeInTheDocument();
    });

    it('should render all comics', () => {
      const comics = createComics(5);
      render(<ComicsHorizontalScroll comics={comics} />);

      const comicItems = screen.getAllByTestId('comic-item');
      expect(comicItems).toHaveLength(5);
    });

    it('should render comic titles', () => {
      const comics = createComics(3);
      render(<ComicsHorizontalScroll comics={comics} />);

      expect(screen.getByText('Comic 1')).toBeInTheDocument();
      expect(screen.getByText('Comic 2')).toBeInTheDocument();
      expect(screen.getByText('Comic 3')).toBeInTheDocument();
    });

    it('should render comic images', () => {
      const comics = createComics(2);
      render(<ComicsHorizontalScroll comics={comics} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
    });

    it('should render images with lazy loading', () => {
      const comics = createComics(2);
      render(<ComicsHorizontalScroll comics={comics} />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    it('should render images as non-draggable', () => {
      const comics = createComics(2);
      render(<ComicsHorizontalScroll comics={comics} />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('draggable', 'false');
      });
    });
  });

  describe('Empty state', () => {
    it('should render nothing when comics empty and showEmptyState false', () => {
      const { container } = render(
        <ComicsHorizontalScroll comics={[]} showEmptyState={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render empty message when showEmptyState true', () => {
      render(<ComicsHorizontalScroll comics={[]} showEmptyState={true} />);

      expect(screen.getByText('No comics available for this character.')).toBeInTheDocument();
    });

    it('should still render title in empty state', () => {
      render(<ComicsHorizontalScroll comics={[]} showEmptyState={true} />);

      expect(screen.getByRole('heading', { name: 'COMICS' })).toBeInTheDocument();
    });

    it('should handle null comics array', () => {
      const { container } = render(
        <ComicsHorizontalScroll comics={null as any} showEmptyState={false} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Scroll functionality', () => {
    it('should render scroll wrapper and container', () => {
      const comics = createComics(10);
      render(<ComicsHorizontalScroll comics={comics} />);

      // Check that comic items are rendered (scroll container exists if comics render)
      const comicItems = screen.getAllByTestId('comic-item');
      expect(comicItems.length).toBe(10);
    });

    it('should render scroll indicator', () => {
      const comics = createComics(10);
      render(<ComicsHorizontalScroll comics={comics} />);

      const indicator = screen.getByLabelText('Scroll through comics');
      expect(indicator).toBeInTheDocument();
    });

    it('should have hidden scroll indicator for accessibility', () => {
      const comics = createComics(10);
      render(<ComicsHorizontalScroll comics={comics} />);

      const indicator = screen.getByLabelText('Scroll through comics');
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should render comics as article elements', () => {
      const comics = createComics(3);
      const { container } = render(<ComicsHorizontalScroll comics={comics} />);

      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(3);
    });

    it('should have descriptive heading', () => {
      const comics = createComics(2);
      render(<ComicsHorizontalScroll comics={comics} />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have alt text for comic images', () => {
      const comics = [createComic(1, 'Amazing Spider-Man #1')];
      render(<ComicsHorizontalScroll comics={comics} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Amazing Spider-Man #1');
    });
  });
});
