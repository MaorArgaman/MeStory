// SEO Components
export {
  SEO,
  HomeSEO,
  MarketplaceSEO,
  BookSEO,
  AuthorSEO,
} from './SEO';

export { default as SEOComponent } from './SEO';

// Structured Data Components (JSON-LD)
export {
  OrganizationSchema,
  BookSchema,
  FAQSchema,
  HowToSchema,
  AuthorSchema,
  BreadcrumbSchema,
  SoftwareApplicationSchema,
  WebsiteSchema,
  ProductSchema,
  ArticleSchema,
  SpeakableSchema,
  VideoSchema,
  ReviewSchema,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_HOWTO_STEPS,
} from './StructuredData';

// Breadcrumb Component (visual + structured data)
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbItem } from './Breadcrumb';

// Featured Snippet Components (optimized for Google Featured Snippets & AI Search)
export {
  DefinitionList,
  PricingComparisonTable,
  StepsList,
  KeyFactsBox,
  MESTORY_DEFINITIONS,
  MESTORY_KEY_FACTS,
} from './FeaturedSnippets';
