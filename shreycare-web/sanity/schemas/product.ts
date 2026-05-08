import { defineType, defineField } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name", maxLength: 96 }, validation: (Rule) => Rule.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    defineField({ name: "price", title: "Price (CAD)", type: "number", validation: (Rule) => Rule.required().positive() }),
    defineField({
      name: "category", title: "Category", type: "string",
      options: { list: [
        { title: "Hair Oil", value: "hair-oil" },
        { title: "Hair Mask", value: "hair-mask" },
        { title: "Face Mask", value: "face-mask" },
        { title: "Other", value: "other" },
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "images", title: "Images", type: "array",
      of: [{ type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Alt Text", type: "string" })] }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({ name: "ingredients", title: "Ingredients", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "benefits", title: "Benefits", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "howToUse", title: "How to Use", type: "array", of: [{ type: "block" }] }),
    defineField({
      name: "tags", title: "Tags", type: "array", of: [{ type: "string" }],
      options: { list: [
        { title: "Best Seller", value: "best-seller" },
        { title: "Limited Edition", value: "limited-edition" },
        { title: "New", value: "new" },
      ]},
    }),
    defineField({ name: "inStock", title: "In Stock", type: "boolean", initialValue: true }),
    defineField({ name: "sortOrder", title: "Sort Order", type: "number", initialValue: 0 }),
    defineField({ name: "bottleCount", title: "Bottles per SKU", type: "number", description: "Number of bottles included. 1 for single bottles, 4 for a 4-pack bundle.", initialValue: 1, validation: (Rule) => Rule.required().positive().integer() }),
    defineField({ name: "qualifiesForFreeShipping", title: "Qualifies for Free Shipping", type: "boolean", description: "Enable for bundles that always ship free regardless of cart quantity.", initialValue: false }),
  ],
  preview: { select: { title: "name", media: "images.0" } },
});
