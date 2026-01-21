import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  jobs: defineTable({
    title: v.string(),
    description: v.string(),
    companyInfo: v.optional(v.string()),
    hiringManager: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    uploadedAt: v.number(),
    updatedAt: v.number(),
  }),
  
  keywords: defineTable({
    jobId: v.id("jobs"),
    text: v.string(),
    isMatched: v.boolean(),
    isManuallyAdded: v.boolean(),
    createdAt: v.number(),
  }).index("by_job", ["jobId"]),
  
  phrases: defineTable({
    jobId: v.id("jobs"),
    keywordId: v.id("keywords"),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("saved")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_job", ["jobId"])
    .index("by_keyword", ["keywordId"]),
});