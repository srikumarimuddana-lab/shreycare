import { defineType, defineField } from "sanity";

export const subscriber = defineType({
  name: "subscriber",
  title: "Newsletter Subscriber",
  type: "document",
  fields: [
    defineField({ name: "email", title: "Email", type: "string", validation: (Rule) => Rule.required().email() }),
    defineField({ name: "subscribedAt", title: "Subscribed At", type: "datetime" }),
  ],
});
