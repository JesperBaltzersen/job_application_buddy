import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("jobs")
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    companyInfo: v.optional(v.string()),
    hiringManager: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("jobs", {
      title: args.title,
      description: args.description,
      companyInfo: args.companyInfo,
      hiringManager: args.hiringManager,
      sourceUrl: args.sourceUrl,
      uploadedAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("jobs"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    companyInfo: v.optional(v.string()),
    hiringManager: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Job not found");
    }
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    // Delete associated keywords and phrases first
    const keywords = await ctx.db
      .query("keywords")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .collect();
    
    for (const keyword of keywords) {
      const phrases = await ctx.db
        .query("phrases")
        .withIndex("by_keyword", (q) => q.eq("keywordId", keyword._id))
        .collect();
      
      for (const phrase of phrases) {
        await ctx.db.delete(phrase._id);
      }
      await ctx.db.delete(keyword._id);
    }
    
    await ctx.db.delete(args.id);
  },
});