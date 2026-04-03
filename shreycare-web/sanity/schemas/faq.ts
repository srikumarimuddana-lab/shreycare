import { defineType, defineField } from "sanity";

export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({ name: "question", title: "Question", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "answer", title: "Answer", type: "array", of: [{ type: "block" }] }),
    defineField({
      name: "category", title: "Category", type: "string",
      options: { list: [
        { title: "Ordering", value: "ordering" },
        { title: "Shipping", value: "shipping" },
        { title: "Products", value: "products" },
        { title: "Returns", value: "returns" },
      ]},
    }),
    defineField({ name: "sortOrder", title: "Sort Order", type: "number", initialValue: 0 }),
  ],
  preview: { select: { title: "question" } },
});
