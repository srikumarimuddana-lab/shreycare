import { defineType, defineField } from "sanity";

export const policyPage = defineType({
  name: "policyPage",
  title: "Policy Page",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (Rule) => Rule.required() }),
    defineField({ name: "body", title: "Body", type: "array", of: [{ type: "block" }] }),
  ],
});
