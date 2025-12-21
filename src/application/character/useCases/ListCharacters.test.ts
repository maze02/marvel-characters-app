import { ListCharacters } from './ListCharacters';
import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { Character } from '@domain/character/entities/Character';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { CharacterName } from '@domain/character/valueObjects/CharacterName';
import { ImageUrl } from '@domain/character/valueObjects/ImageUrl';

describe('ListCharacters Use Case', () => {
  const createMockRepository = (): jest.Mocked<CharacterRepository> => ({
    findMany: jest.fn(),
    findById: jest.fn(),
    searchByName: jest.fn(),
    getComics: jest.fn(),
  });

  const createMockCharacter = (id: number, name: string): Character =>
    new Character({
      id: new CharacterId(id),
      name: new CharacterName(name),
      description: 'Test character',
      thumbnail: new ImageUrl('http://example.com/image', 'jpg'),
      modifiedDate: new Date(),
    });

  it('should list first 50 characters by default', async () => {
    const mockRepo = createMockRepository();
    const mockCharacters = [createMockCharacter(1, 'Test')];
    
    mockRepo.findMany.mockResolvedValue({
      items: mockCharacters,
      total: 1000,
      offset: 0,
      limit: 50,
    });

    const useCase = new ListCharacters(mockRepo);
    const result = await useCase.execute();

    expect(mockRepo.findMany).toHaveBeenCalledWith({ limit: 50, offset: 0 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1000);
  });

  it('should accept custom pagination params', async () => {
    const mockRepo = createMockRepository();
    mockRepo.findMany.mockResolvedValue({
      items: [],
      total: 0,
      offset: 10,
      limit: 20,
    });

    const useCase = new ListCharacters(mockRepo);
    await useCase.execute({ limit: 20, offset: 10 });

    expect(mockRepo.findMany).toHaveBeenCalledWith({ limit: 20, offset: 10 });
  });

  it('should throw error for invalid limit', async () => {
    const mockRepo = createMockRepository();
    const useCase = new ListCharacters(mockRepo);

    await expect(useCase.execute({ limit: 0 })).rejects.toThrow('between 1 and 100');
    await expect(useCase.execute({ limit: 101 })).rejects.toThrow('between 1 and 100');
  });

  it('should throw error for negative offset', async () => {
    const mockRepo = createMockRepository();
    const useCase = new ListCharacters(mockRepo);

    await expect(useCase.execute({ offset: -1 })).rejects.toThrow('non-negative');
  });
});
