import { defineType, defineField } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (Rule) => Rule.required() }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3, validation: (Rule) => Rule.max(200) }),
    defineField({ name: "featuredImage", title: "Featured Image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "body", title: "Body", type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Alt Text", type: "string" })] }],
    }),
    defineField({
      name: "category", title: "Category", type: "string",
      options: { list: [
        { title: "Ingredients", value: "ingredients" },
        { title: "Hair Care", value: "hair-care" },
        { title: "Rituals", value: "rituals" },
        { title: "News", value: "news" },
      ]},
    }),
    defineField({ name: "publishedAt", title: "Published At", type: "datetime" }),
    defineField({ name: "author", title: "Author", type: "string" }),
  ],
  preview: { select: { title: "title", media: "featuredImage" } },
});
