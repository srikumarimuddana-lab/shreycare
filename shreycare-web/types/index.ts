export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: "hair-oil" | "hair-mask" | "face-mask" | "other";
  images: SanityImage[];
  ingredients: string[];
  benefits: PortableTextBlock[];
  howToUse: PortableTextBlock[];
  tags: string[];
  inStock: boolean;
}

export interface SanityImage {
  _key: string;
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: SanityImage;
  body: PortableTextBlock[];
  category: string;
  publishedAt: string;
  author: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: PortableTextBlock[];
  category: string;
  sortOrder: number;
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
}

export interface SiteSettings {
  brandName: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: {
    instagram: string;
    pinterest: string;
  };
  announcementBar?: string;
}

export interface PortableTextBlock {
  _type: string;
  _key: string;
  [key: string]: unknown;
}
