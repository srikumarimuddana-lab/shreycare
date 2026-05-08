export const allProductsQuery = `*[_type == "product" && inStock == true] | order(sortOrder asc) {
  _id, name, "slug": slug.current, description, price, category, images, ingredients, tags, bottleCount, qualifiesForFreeShipping
}`;

export const productBySlugQuery = `*[_type == "product" && slug.current == $slug][0] {
  _id, name, "slug": slug.current, description, price, category, images, ingredients, benefits, howToUse, tags, inStock, bottleCount, qualifiesForFreeShipping
}`;

export const productsByCategoryQuery = `*[_type == "product" && category == $category && inStock == true] | order(sortOrder asc) {
  _id, name, "slug": slug.current, description, price, category, images, tags, bottleCount, qualifiesForFreeShipping
}`;

export const featuredProductsQuery = `*[_type == "product" && inStock == true] | order(sortOrder asc) [0...4] {
  _id, name, "slug": slug.current, description, price, images, ingredients, tags, bottleCount, qualifiesForFreeShipping
}`;

export const allBlogPostsQuery = `*[_type == "blogPost"] | order(publishedAt desc) {
  _id, title, "slug": slug.current, excerpt, featuredImage, category, publishedAt, author
}`;

export const blogPostBySlugQuery = `*[_type == "blogPost" && slug.current == $slug][0] {
  _id, title, "slug": slug.current, excerpt, featuredImage, body, category, publishedAt, author
}`;

export const allFaqsQuery = `*[_type == "faq"] | order(sortOrder asc) {
  _id, question, answer, category
}`;

export const pageContentQuery = `*[_type == "pageContent"][0] {
  heroHeadline, heroSubtext, heroCTA, testimonials, newsletterHeadline, newsletterSubtext, aboutContent
}`;

export const policyPageBySlugQuery = `*[_type == "policyPage" && slug.current == $slug][0] {
  title, body
}`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  brandName, contactEmail, contactPhone, socialLinks, announcementBar
}`;

export const hairOilProductsQuery = `*[_type == "product" && category == "hair-oil" && inStock == true] | order(sortOrder asc) {
  _id, name, "slug": slug.current, description, price, images, tags, bottleCount, qualifiesForFreeShipping
}`;
