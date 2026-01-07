import { FilterCharacters } from "./FilterCharacters";
import { Character } from "@domain/character/entities/Character";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { CharacterName } from "@domain/character/valueObjects/CharacterName";
import { ImageUrl } from "@domain/character/valueObjects/ImageUrl";

describe("FilterCharacters Use Case", () => {
  let useCase: FilterCharacters;
  let mockCharacters: Character[];

  beforeEach(() => {
    useCase = new FilterCharacters();

    // Create mock characters
    mockCharacters = [
      new Character({
        id: new CharacterId(1),
        name: new CharacterName("Spider-Man"),
        description: "Friendly neighborhood hero",
        thumbnail: new ImageUrl("https://example.com/spiderman", "jpg"),
      }),
      new Character({
        id: new CharacterId(2),
        name: new CharacterName("Iron Man"),
        description: "Genius billionaire",
        thumbnail: new ImageUrl("https://example.com/ironman", "jpg"),
      }),
      new Character({
        id: new CharacterId(3),
        name: new CharacterName("Captain America"),
        description: "Super soldier",
        thumbnail: new ImageUrl("https://example.com/cap", "jpg"),
      }),
      new Character({
        id: new CharacterId(4),
        name: new CharacterName("Spider-Woman"),
        description: "Jessica Drew",
        thumbnail: new ImageUrl("https://example.com/spiderwoman", "jpg"),
      }),
    ];
  });

  it("should return all characters when query is empty", () => {
    const result = useCase.execute(mockCharacters, "");
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockCharacters);
  });

  it("should return all characters when query is only whitespace", () => {
    const result = useCase.execute(mockCharacters, "   ");
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockCharacters);
  });

  it("should filter characters by name (case-insensitive)", () => {
    const result = useCase.execute(mockCharacters, "spider");
    expect(result).toHaveLength(2);
    expect(result[0]?.name.value).toBe("Spider-Man");
    expect(result[1]?.name.value).toBe("Spider-Woman");
  });

  it("should filter characters with uppercase query", () => {
    const result = useCase.execute(mockCharacters, "SPIDER");
    expect(result).toHaveLength(2);
  });

  it("should filter characters with mixed case query", () => {
    const result = useCase.execute(mockCharacters, "SpIdEr");
    expect(result).toHaveLength(2);
  });

  it("should filter by partial name match", () => {
    const result = useCase.execute(mockCharacters, "man");
    expect(result).toHaveLength(3);
    // Should match Spider-Man, Iron Man, and Spider-Woman (contains "man")
  });

  it("should return empty array when no matches found", () => {
    const result = useCase.execute(mockCharacters, "Hulk");
    expect(result).toHaveLength(0);
  });

  it("should handle special characters in query", () => {
    const result = useCase.execute(mockCharacters, "Spider-");
    expect(result).toHaveLength(2);
  });

  it("should return empty array when given empty character list", () => {
    const result = useCase.execute([], "Spider");
    expect(result).toHaveLength(0);
  });

  it("should trim whitespace from query", () => {
    const result = useCase.execute(mockCharacters, "  Iron  ");
    expect(result).toHaveLength(1);
    expect(result[0]?.name.value).toBe("Iron Man");
  });
});
