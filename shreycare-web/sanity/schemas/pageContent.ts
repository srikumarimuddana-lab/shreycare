import { defineType, defineField } from "sanity";

export const pageContent = defineType({
  name: "pageContent",
  title: "Page Content",
  type: "document",
  fields: [
    defineField({ name: "heroHeadline", title: "Hero Headline", type: "string" }),
    defineField({ name: "heroSubtext", title: "Hero Subtext", type: "text" }),
    defineField({ name: "heroCTA", title: "Hero CTA Text", type: "string" }),
    defineField({
      name: "testimonials", title: "Testimonials", type: "array",
      of: [{ type: "object", fields: [
        defineField({ name: "quote", title: "Quote", type: "text" }),
        defineField({ name: "name", title: "Name", type: "string" }),
        defineField({ name: "title", title: "Title", type: "string" }),
      ]}],
    }),
    defineField({ name: "newsletterHeadline", title: "Newsletter Headline", type: "string" }),
    defineField({ name: "newsletterSubtext", title: "Newsletter Subtext", type: "text" }),
    defineField({ name: "aboutContent", title: "About Page Content", type: "array", of: [{ type: "block" }] }),
  ],
});
