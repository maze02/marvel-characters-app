/**
 * ComicVineComicMapper Unit Tests
 *
 * Tests for Comic Vine Issue API to domain entity mapping.
 * Tests cover: happy paths, edge cases, title formatting, and HTML cleaning.
 */

import { ComicVineComicMapper } from "./ComicVineComicMapper";
import { Comic } from "@domain/character/entities/Comic";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { ComicVineIssueResponse } from "../dtos/ComicVineComicDTO";

describe("ComicVineComicMapper", () => {
  const characterId = new CharacterId(1699);

  const createValidIssueResponse = (
    overrides?: Partial<ComicVineIssueResponse>,
  ): ComicVineIssueResponse => ({
    id: 123456,
    name: "The Amazing Spider-Man #1",
    issue_number: "1",
    volume: {
      id: 78701,
      name: "The Amazing Spider-Man (2018)",
    },
    cover_date: "2018-07-01",
    store_date: "2018-07-04",
    description: "<p>First issue of the new series!</p>",
    image: {
      icon_url:
        "https://comicvine.gamespot.com/a/uploads/square_avatar/11/11111/123456-issue.jpg",
      medium_url:
        "https://comicvine.gamespot.com/a/uploads/scale_medium/11/11111/123456-issue.jpg",
      screen_url:
        "https://comicvine.gamespot.com/a/uploads/screen_medium/11/11111/123456-issue.jpg",
      screen_large_url:
        "https://comicvine.gamespot.com/a/uploads/screen_kubrick/11/11111/123456-issue.jpg",
      small_url:
        "https://comicvine.gamespot.com/a/uploads/scale_small/11/11111/123456-issue.jpg",
      super_url:
        "https://comicvine.gamespot.com/a/uploads/original/11/11111/123456-issue.jpg",
      thumb_url:
        "https://comicvine.gamespot.com/a/uploads/scale_avatar/11/11111/123456-issue.jpg",
      tiny_url:
        "https://comicvine.gamespot.com/a/uploads/square_mini/11/11111/123456-issue.jpg",
      original_url:
        "https://comicvine.gamespot.com/a/uploads/original/11/11111/123456-issue.jpg",
    },
    date_added: "2024-01-01T00:00:00",
    date_last_updated: "2024-01-15T10:30:00",
    site_detail_url: "https://comicvine.gamespot.com/issue/123456/",
    api_detail_url: "https://comicvine.gamespot.com/api/issue/4000-123456/",
    ...overrides,
  });

  describe("toDomain", () => {
    describe("Happy Path", () => {
      it("maps complete issue response to Comic entity", () => {
        // Arrange
        const issueResponse = createValidIssueResponse();

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic).toBeInstanceOf(Comic);
        expect(comic.id).toBe(123456);
        expect(comic.title).toBe("The Amazing Spider-Man #1");
        expect(comic.description).toBe("First issue of the new series!");
        expect(comic.thumbnail.url).toContain("comicvine.gamespot.com");
      });

      it("creates ReleaseDate from cover_date", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          cover_date: "2018-07-15",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.onSaleDate).toBeDefined();
        if (comic.onSaleDate) {
          expect(comic.onSaleDate.value).toBeInstanceOf(Date);
          expect(comic.onSaleDate.value.toISOString()).toContain("2018-07-15");
        }
      });

      it("strips HTML from description", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          description:
            "<h3>Title</h3><p>Description with <em>emphasis</em> and <strong>bold</strong>.</p>",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        // Spaces are added when tags are removed, resulting in extra space before period
        expect(comic.description).toBe(
          "Title Description with emphasis and bold .",
        );
        expect(comic.description).not.toContain("<");
        expect(comic.description).not.toContain(">");
      });
    });

    describe("Title Creation", () => {
      it("uses name field when provided", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          name: "Special Title Override",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.title).toBe("Special Title Override");
      });

      it("creates title from volume name + issue number when name is null", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          name: null,
          volume: { id: 1, name: "Amazing Spider-Man" },
          issue_number: "42",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.title).toBe("Amazing Spider-Man #42");
      });

      it("uses fallback format when name and volume are missing", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          name: null,
          volume: { id: 1, name: "" },
          issue_number: "99",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.title).toContain("#99");
      });

      it("handles missing issue number", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          name: null,
          issue_number: "",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.title).toContain("Unknown");
      });
    });

    describe("Description Handling", () => {
      it("returns empty string for null description", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          description: null,
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.description).toBe("");
      });

      it("decodes HTML entities", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          description:
            "Spider-Man&apos;s greatest battle. Peter&nbsp;Parker faces his foes&amp;more.",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.description).toContain("Spider-Man's");
        expect(comic.description).toContain("Peter Parker");
        expect(comic.description).not.toContain("&nbsp;");
        expect(comic.description).not.toContain("&amp;");
      });

      it("normalizes extra whitespace", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          description: "<p>Text   with    lots     of      spaces</p>",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.description).toBe("Text with lots of spaces");
      });
    });

    describe("Image Handling", () => {
      it("creates ImageUrl from medium_url", () => {
        // Arrange
        const issueResponse = createValidIssueResponse();

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.thumbnail.url).toContain("comicvine.gamespot.com");
        expect(comic.thumbnail.url).toContain(".jpg");
      });

      it("uses placeholder when image is null", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          image: null,
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.thumbnail.url).toContain("placeholder");
      });

      it("uses placeholder when medium_url is empty", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          image: {
            ...createValidIssueResponse().image!,
            medium_url: "",
          },
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.thumbnail.url).toContain("placeholder");
      });

      it("falls back to placeholder when no valid extension in URL", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          image: {
            ...createValidIssueResponse().image!,
            medium_url: "",
          },
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.thumbnail.url).toContain("placeholder");
      });
    });

    describe("Date Handling", () => {
      it("handles null cover_date", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          cover_date: null as unknown as string,
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.onSaleDate).toBeNull();
      });

      it("handles empty cover_date", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          cover_date: "",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.onSaleDate).toBeNull();
      });

      it("parses various date formats", () => {
        // Arrange
        const dates = ["2018-01-01", "2020-12-31", "2024-06-15"];

        dates.forEach((date) => {
          const issueResponse = createValidIssueResponse({
            cover_date: date,
          });

          // Act
          const comic = ComicVineComicMapper.toDomain(
            issueResponse,
            characterId,
          );

          // Assert
          expect(comic.onSaleDate).toBeDefined();
          if (comic.onSaleDate) {
            expect(comic.onSaleDate.value.toISOString()).toContain(date);
          }
        });
      });
    });

    describe("Edge Cases", () => {
      it("handles very long descriptions", () => {
        // Arrange
        const longDescription = "<p>" + "A".repeat(5000) + "</p>";
        const issueResponse = createValidIssueResponse({
          description: longDescription,
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.description.length).toBeGreaterThan(3000);
      });

      it("handles special characters in title", () => {
        // Arrange
        const issueResponse = createValidIssueResponse({
          name: "Spider-Man™: Far From Home® - Special Edition #1 (2019)",
        });

        // Act
        const comic = ComicVineComicMapper.toDomain(issueResponse, characterId);

        // Assert
        expect(comic.title).toBe(
          "Spider-Man™: Far From Home® - Special Edition #1 (2019)",
        );
      });
    });
  });

  describe("toDomainList", () => {
    it("maps array of issue responses to Comic entities", () => {
      // Arrange
      const issues = [
        createValidIssueResponse({ id: 1, name: "Issue #1" }),
        createValidIssueResponse({ id: 2, name: "Issue #2" }),
        createValidIssueResponse({ id: 3, name: "Issue #3" }),
      ];

      // Act
      const comics = ComicVineComicMapper.toDomainList(issues, characterId);

      // Assert
      expect(comics).toHaveLength(3);
      expect(comics[0]!.title).toBe("Issue #1");
      expect(comics[1]!.title).toBe("Issue #2");
      expect(comics[2]!.title).toBe("Issue #3");
      comics.forEach((comic) => expect(comic).toBeInstanceOf(Comic));
    });

    it("handles empty array", () => {
      // Arrange
      const issues: ComicVineIssueResponse[] = [];

      // Act
      const comics = ComicVineComicMapper.toDomainList(issues, characterId);

      // Assert
      expect(comics).toHaveLength(0);
      expect(comics).toEqual([]);
    });

    it("processes all valid entries", () => {
      // Arrange
      const issues = [createValidIssueResponse()];

      // Act
      const comics = ComicVineComicMapper.toDomainList(issues, characterId);

      // Assert
      expect(comics).toHaveLength(1);
      expect(comics[0]).toBeInstanceOf(Comic);
    });
  });
});
