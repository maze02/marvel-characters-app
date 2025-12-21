import { ComicVineCharacterMapper } from './ComicVineCharacterMapper';
import { ComicVineCharacterResponse } from '../dtos/ComicVineCharacterDTO';
import { Character } from '@domain/character/entities/Character';

describe('ComicVineCharacterMapper', () => {
  const mockComicVineResponse: ComicVineCharacterResponse = {
    id: 1699,
    name: 'Spider-Man',
    deck: 'Bitten by a radioactive spider, Peter Parker gained spider-like powers.',
    description: '<p>Peter Parker was <strong>bitten</strong> by a radioactive spider.</p><p>He became Spider-Man.</p>',
    image: {
      icon_url: 'https://comicvine.gamespot.com/a/uploads/square_avatar/11/111/1-icon.jpg',
      medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/111/1-medium.jpg',
      screen_url: 'https://comicvine.gamespot.com/a/uploads/screen_medium/11/111/1-screen.jpg',
      screen_large_url: 'https://comicvine.gamespot.com/a/uploads/screen_large/11/111/1-large.jpg',
      small_url: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/111/1-small.jpg',
      super_url: 'https://comicvine.gamespot.com/a/uploads/scale_large/11/111/1-super.jpg',
      thumb_url: 'https://comicvine.gamespot.com/a/uploads/scale_avatar/11/111/1-thumb.jpg',
      tiny_url: 'https://comicvine.gamespot.com/a/uploads/square_mini/11/111/1-tiny.jpg',
      original_url: 'https://comicvine.gamespot.com/a/uploads/original/11/111/1-original.jpg',
    },
    publisher: {
      id: 31,
      name: 'Marvel Comics',
    },
    date_added: '2008-06-06 11:27:00',
    date_last_updated: '2024-12-01 15:30:00',
    site_detail_url: 'https://comicvine.gamespot.com/spider-man/4005-1699/',
    api_detail_url: 'https://comicvine.gamespot.com/api/character/4005-1699/',
  };

  describe('toDomain', () => {
    it('should map Comic Vine response to Character entity', () => {
      const character = ComicVineCharacterMapper.toDomain(mockComicVineResponse);

      expect(character).toBeInstanceOf(Character);
      expect(character.id.value).toBe(1699);
      expect(character.name.value).toBe('Spider-Man');
    });

    it('should clean HTML from description', () => {
      const character = ComicVineCharacterMapper.toDomain(mockComicVineResponse);

      // Should strip HTML tags
      expect(character.description).not.toContain('<p>');
      expect(character.description).not.toContain('<strong>');
      expect(character.description).toContain('Peter Parker was bitten');
      expect(character.description).toContain('He became Spider-Man');
    });

    it('should use deck when description is null', () => {
      const responseWithNullDesc: ComicVineCharacterResponse = {
        ...mockComicVineResponse,
        description: null,
      };

      const character = ComicVineCharacterMapper.toDomain(responseWithNullDesc);

      expect(character.description).toBe('Bitten by a radioactive spider, Peter Parker gained spider-like powers.');
    });

    it('should handle missing description and deck', () => {
      const responseWithNoDesc: ComicVineCharacterResponse = {
        ...mockComicVineResponse,
        description: null,
        deck: null,
      };

      const character = ComicVineCharacterMapper.toDomain(responseWithNoDesc);

      expect(character.description).toBe('');
    });

    it('should parse Comic Vine image URLs correctly', () => {
      const character = ComicVineCharacterMapper.toDomain(mockComicVineResponse);

      expect(character.thumbnail).toBeDefined();
      // Should extract path and extension from URL
      const thumbnailUrl = character?.getThumbnailUrl();
      expect(thumbnailUrl).toBeTruthy();
    });

    it('should handle HTML entities in description', () => {
      const responseWithEntities: ComicVineCharacterResponse = {
        ...mockComicVineResponse,
        description: '<p>Peter &amp; Mary Jane &nbsp; &lt;3</p>',
      };

      const character = ComicVineCharacterMapper.toDomain(responseWithEntities);

      expect(character.description).toBe('Peter & Mary Jane <3');
    });

    it('should parse date correctly', () => {
      const character = ComicVineCharacterMapper.toDomain(mockComicVineResponse);

      expect(character.modifiedDate).toBeDefined();
    });
  });

  describe('toDomainList', () => {
    it('should map array of responses to array of Characters', () => {
      const responses = [mockComicVineResponse, { ...mockComicVineResponse, id: 1234, name: 'Iron Man' }];

      const characters = ComicVineCharacterMapper.toDomainList(responses);

      expect(characters).toHaveLength(2);
      expect(characters[0]).toBeInstanceOf(Character);
      expect(characters[1]).toBeInstanceOf(Character);
      expect(characters[0]).toBeDefined();
      expect(characters[1]).toBeDefined();
      expect(characters[0]?.name.value).toBe('Spider-Man');
      expect(characters[1]?.name.value).toBe('Iron Man');
    });

    it('should handle empty array', () => {
      const characters = ComicVineCharacterMapper.toDomainList([]);

      expect(characters).toHaveLength(0);
    });
  });
});
