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
  DEFAULT_FAQ_ITEMS,
  DEFAULT_HOWTO_STEPS,
} from './StructuredData';

// Breadcrumb Component (visual + structured data)
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbItem } from './Breadcrumb';
