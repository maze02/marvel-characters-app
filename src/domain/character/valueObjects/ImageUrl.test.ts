/**
 * ImageUrl Tests
 */

import { ImageUrl } from "./ImageUrl";

describe("ImageUrl", () => {
  describe("constructor", () => {
    it("should create with valid path and extension", () => {
      const url = new ImageUrl("http://example.com/image", "jpg");
      expect(url).toBeDefined();
    });

    it("should throw on empty path", () => {
      expect(() => new ImageUrl("", "jpg")).toThrow(
        "Image path cannot be empty",
      );
    });

    it("should throw on whitespace-only path", () => {
      expect(() => new ImageUrl("   ", "jpg")).toThrow(
        "Image path cannot be empty",
      );
    });

    it("should throw on empty extension", () => {
      expect(() => new ImageUrl("http://example.com/image", "")).toThrow(
        "Image extension cannot be empty",
      );
    });

    it("should throw on whitespace-only extension", () => {
      expect(() => new ImageUrl("http://example.com/image", "   ")).toThrow(
        "Image extension cannot be empty",
      );
    });

    it("should throw on invalid extension", () => {
      expect(() => new ImageUrl("http://example.com/image", "bmp")).toThrow(
        "Invalid image extension: bmp",
      );
    });

    it("should accept jpg extension", () => {
      expect(
        () => new ImageUrl("http://example.com/image", "jpg"),
      ).not.toThrow();
    });

    it("should accept jpeg extension", () => {
      expect(
        () => new ImageUrl("http://example.com/image", "jpeg"),
      ).not.toThrow();
    });

    it("should accept png extension", () => {
      expect(
        () => new ImageUrl("http://example.com/image", "png"),
      ).not.toThrow();
    });

    it("should accept gif extension", () => {
      expect(
        () => new ImageUrl("http://example.com/image", "gif"),
      ).not.toThrow();
    });

    it("should normalize extension to lowercase", () => {
      const url = new ImageUrl("http://example.com/image", "JPG");
      expect(url.extension).toBe("jpg");
    });

    it("should trim path whitespace", () => {
      const url = new ImageUrl("  http://example.com/image  ", "jpg");
      expect(url.path).toBe("http://example.com/image");
    });
  });

  describe("getUrl", () => {
    it("should return URL without variant", () => {
      const url = new ImageUrl("http://example.com/image", "jpg");
      expect(url.getUrl()).toBe("http://example.com/image.jpg");
    });

    it("should return URL with variant", () => {
      const url = new ImageUrl("http://example.com/image", "jpg");
      expect(url.getUrl("portrait_xlarge")).toBe(
        "http://example.com/image/portrait_xlarge.jpg",
      );
    });

    it("should handle Comic Vine URLs", () => {
      const url = new ImageUrl(
        "https://comicvine.gamespot.com/api/image/screen_large/123",
        "jpg",
      );
      expect(url.getUrl()).toBe(
        "https://comicvine.gamespot.com/api/image/screen_large/123.jpg",
      );
    });

    it("should ignore variant for Comic Vine URLs", () => {
      const url = new ImageUrl(
        "https://comicvine.gamespot.com/api/image/screen_large/123",
        "jpg",
      );
      expect(url.getUrl("portrait_xlarge")).toBe(
        "https://comicvine.gamespot.com/api/image/screen_large/123.jpg",
      );
    });
  });

  describe("path", () => {
    it("should return path", () => {
      const url = new ImageUrl("http://example.com/image", "jpg");
      expect(url.path).toBe("http://example.com/image");
    });
  });

  describe("extension", () => {
    it("should return extension", () => {
      const url = new ImageUrl("http://example.com/image", "jpg");
      expect(url.extension).toBe("jpg");
    });
  });

  describe("isPlaceholder", () => {
    it("should return true for image_not_available", () => {
      const url = new ImageUrl("http://example.com/image_not_available", "jpg");
      expect(url.isPlaceholder()).toBe(true);
    });

    it("should return false for normal image", () => {
      const url = new ImageUrl("http://example.com/image", "jpg");
      expect(url.isPlaceholder()).toBe(false);
    });
  });

  describe("equals", () => {
    it("should return true for same path and extension", () => {
      const url1 = new ImageUrl("http://example.com/image", "jpg");
      const url2 = new ImageUrl("http://example.com/image", "jpg");
      expect(url1.equals(url2)).toBe(true);
    });

    it("should return false for different paths", () => {
      const url1 = new ImageUrl("http://example.com/image1", "jpg");
      const url2 = new ImageUrl("http://example.com/image2", "jpg");
      expect(url1.equals(url2)).toBe(false);
    });

    it("should return false for different extensions", () => {
      const url1 = new ImageUrl("http://example.com/image", "jpg");
      const url2 = new ImageUrl("http://example.com/image", "png");
      expect(url1.equals(url2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return URL string", () => {
      const url = new ImageUrl("http://example.com/image", "jpg");
      expect(url.toString()).toBe("http://example.com/image.jpg");
    });
  });
});
