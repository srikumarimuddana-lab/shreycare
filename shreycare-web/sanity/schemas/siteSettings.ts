import { defineType, defineField } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({ name: "brandName", title: "Brand Name", type: "string" }),
    defineField({ name: "contactEmail", title: "Contact Email", type: "string" }),
    defineField({ name: "contactPhone", title: "Contact Phone", type: "string" }),
    defineField({
      name: "socialLinks", title: "Social Links", type: "object",
      fields: [
        defineField({ name: "instagram", title: "Instagram URL", type: "url" }),
        defineField({ name: "pinterest", title: "Pinterest URL", type: "url" }),
      ],
    }),
    defineField({ name: "announcementBar", title: "Announcement Bar Text", type: "string", description: "Leave empty to hide the announcement bar" }),
  ],
});
