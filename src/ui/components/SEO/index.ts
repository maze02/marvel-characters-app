/**
 * SEO Component Exports
 *
 * Centralized export for SEO-related components and types.
 *
 * Architecture Note:
 * This component follows Hexagonal Architecture:
 * - SEO component (UI layer) uses SEOService via Dependency Injection
 * - SEOService interface (application layer) defines the contract
 * - BrowserSEOService (infrastructure layer) implements the contract
 */

export { SEO } from "./SEO";
export type { SEOProps } from "./SEO";
export type {
  SEOMetadata,
  SEOService,
} from "@application/seo/ports/SEOService";
