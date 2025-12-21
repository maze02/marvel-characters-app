/**
 * ImageUrl Value Object
 * 
 * Represents a Marvel API image URL with path and extension.
 * Handles URL construction and validation for Marvel's image system.
 * 
 * @example
 * ```typescript
 * const imageUrl = new ImageUrl(
 *   'http://i.annihil.us/u/prod/marvel/i/mg/3/40/4bb4680432f73',
 *   'jpg'
 * );
 * console.log(imageUrl.getUrl('portrait_xlarge')); // Full URL with variant
 * ```
 */
export class ImageUrl {
  private readonly _path: string;
  private readonly _extension: string;

  constructor(path: string, extension: string) {
    if (!path || path.trim() === '') {
      throw new Error('Image path cannot be empty');
    }
    
    if (!extension || extension.trim() === '') {
      throw new Error('Image extension cannot be empty');
    }
    
    // Validate extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    if (!validExtensions.includes(extension.toLowerCase())) {
      throw new Error(`Invalid image extension: ${extension}`);
    }
    
    this._path = path.trim();
    this._extension = extension.toLowerCase().trim();
  }

  /**
   * Get the full image URL with optional size variant
   * 
   * @param variant - Image variant (Marvel API style, ignored for Comic Vine complete URLs)
   * @returns Complete image URL
   */
  getUrl(variant?: string): string {
    // If path already contains Comic Vine domain, it's a complete URL - just add extension
    if (this._path.includes('comicvine.gamespot.com')) {
      return `${this._path}.${this._extension}`;
    }
    
    // Marvel API style: path + variant + extension
    if (variant) {
      return `${this._path}/${variant}.${this._extension}`;
    }
    return `${this._path}.${this._extension}`;
  }

  get path(): string {
    return this._path;
  }

  get extension(): string {
    return this._extension;
  }

  /**
   * Check if this is a placeholder/missing image
   */
  isPlaceholder(): boolean {
    return this._path.includes('image_not_available');
  }

  equals(other: ImageUrl): boolean {
    return this._path === other._path && this._extension === other._extension;
  }

  toString(): string {
    return this.getUrl();
  }
}
