import { ComicVineComicMapper } from './ComicVineComicMapper';
import { ComicVineIssueResponse } from '../dtos/ComicVineComicDTO';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { Comic } from '@domain/character/entities/Comic';

describe('ComicVineComicMapper', () => {
  const mockIssueResponse: ComicVineIssueResponse = {
    id: 12345,
    name: 'Amazing Spider-Man Annual',
    issue_number: '1',
    volume: {
      id: 2127,
      name: 'Amazing Spider-Man',
    },
    cover_date: '2024-01-15',
    store_date: '2024-01-10',
    description: '<p>Spider-Man faces his greatest challenge yet!</p>',
    image: {
      icon_url: 'https://comicvine.gamespot.com/a/uploads/square_avatar/11/111/12345-icon.jpg',
      medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/111/12345-medium.jpg',
      screen_url: 'https://comicvine.gamespot.com/a/uploads/screen_medium/11/111/12345-screen.jpg',
      screen_large_url: 'https://comicvine.gamespot.com/a/uploads/screen_large/11/111/12345-large.jpg',
      small_url: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/111/12345-small.jpg',
      super_url: 'https://comicvine.gamespot.com/a/uploads/scale_large/11/111/12345-super.jpg',
      thumb_url: 'https://comicvine.gamespot.com/a/uploads/scale_avatar/11/111/12345-thumb.jpg',
      tiny_url: 'https://comicvine.gamespot.com/a/uploads/square_mini/11/111/12345-tiny.jpg',
      original_url: 'https://comicvine.gamespot.com/a/uploads/original/11/111/12345-original.jpg',
    },
    date_added: '2024-01-01 10:00:00',
    date_last_updated: '2024-01-05 14:30:00',
    site_detail_url: 'https://comicvine.gamespot.com/amazing-spider-man-1/4000-12345/',
    api_detail_url: 'https://comicvine.gamespot.com/api/issue/4000-12345/',
  };

  const characterId = new CharacterId(1699);

  describe('toDomain', () => {
    it('should map Comic Vine issue to Comic entity', () => {
      const comic = ComicVineComicMapper.toDomain(mockIssueResponse, characterId);

      expect(comic).toBeInstanceOf(Comic);
      expect(comic.id).toBe(12345);
      expect(comic.title).toBe('Amazing Spider-Man Annual');
    });

    it('should use issue name as title', () => {
      const comic = ComicVineComicMapper.toDomain(mockIssueResponse, characterId);

      expect(comic.title).toBe('Amazing Spider-Man Annual');
    });

    it('should create title from volume + issue number when name is null', () => {
      const responseWithoutName: ComicVineIssueResponse = {
        ...mockIssueResponse,
        name: null,
      };

      const comic = ComicVineComicMapper.toDomain(responseWithoutName, characterId);

      expect(comic.title).toBe('Amazing Spider-Man #1');
    });

    it('should clean HTML from description', () => {
      const comic = ComicVineComicMapper.toDomain(mockIssueResponse, characterId);

      expect(comic.description).not.toContain('<p>');
      expect(comic.description).toBe('Spider-Man faces his greatest challenge yet!');
    });

    it('should handle missing description', () => {
      const responseWithoutDesc: ComicVineIssueResponse = {
        ...mockIssueResponse,
        description: null,
      };

      const comic = ComicVineComicMapper.toDomain(responseWithoutDesc, characterId);

      expect(comic.description).toBe('');
    });

    it('should parse cover date correctly', () => {
      const comic = ComicVineComicMapper.toDomain(mockIssueResponse, characterId);

      expect(comic.onSaleDate).toBeDefined();
      expect(comic.hasReleaseDate()).toBe(true);
    });

    it('should handle missing image', () => {
      const responseWithoutImage: ComicVineIssueResponse = {
        ...mockIssueResponse,
        image: null,
      };

      const comic = ComicVineComicMapper.toDomain(responseWithoutImage, characterId);

      // Should create placeholder
      expect(comic.thumbnail).toBeDefined();
    });

    it('should associate character ID', () => {
      const comic = ComicVineComicMapper.toDomain(mockIssueResponse, characterId);

      expect(comic.characterId.value).toBe(1699);
    });
  });

  describe('toDomainList', () => {
    it('should map array of issues to array of Comics', () => {
      const responses = [
        mockIssueResponse,
        { ...mockIssueResponse, id: 67890, name: 'Spider-Man vs Venom' },
      ];

      const comics = ComicVineComicMapper.toDomainList(responses, characterId);

      expect(comics).toHaveLength(2);
      expect(comics[0]).toBeInstanceOf(Comic);
      expect(comics[1]).toBeInstanceOf(Comic);
      expect(comics[0]?.title).toBe('Amazing Spider-Man Annual');
      expect(comics[1]?.title).toBe('Spider-Man vs Venom');
    });

    it('should handle empty array', () => {
      const comics = ComicVineComicMapper.toDomainList([], characterId);

      expect(comics).toHaveLength(0);
    });

    it('should apply same character ID to all comics', () => {
      const responses = [mockIssueResponse, { ...mockIssueResponse, id: 67890 }];

      const comics = ComicVineComicMapper.toDomainList(responses, characterId);

      expect(comics[0]?.characterId.value).toBe(1699);
      expect(comics[1]?.characterId.value).toBe(1699);
    });
  });
});
