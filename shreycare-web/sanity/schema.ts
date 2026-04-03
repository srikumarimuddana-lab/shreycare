import { type SchemaTypeDefinition } from "sanity";
import { product } from "./schemas/product";
import { blogPost } from "./schemas/blogPost";
import { faq } from "./schemas/faq";
import { pageContent } from "./schemas/pageContent";
import { policyPage } from "./schemas/policyPage";
import { subscriber } from "./schemas/subscriber";
import { siteSettings } from "./schemas/siteSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, blogPost, faq, pageContent, policyPage, subscriber, siteSettings],
};
