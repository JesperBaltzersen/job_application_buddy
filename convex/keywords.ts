import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("keywords")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
  },
});

export const create = mutation({
  args: {
    jobId: v.id("jobs"),
    text: v.string(),
    isManuallyAdded: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("keywords", {
      jobId: args.jobId,
      text: args.text,
      isMatched: false,
      isManuallyAdded: args.isManuallyAdded,
      createdAt: Date.now(),
    });
  },
});

export const createMany = mutation({
  args: {
    jobId: v.id("jobs"),
    keywords: v.array(v.string()),
    isManuallyAdded: v.boolean(),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const text of args.keywords) {
      const id = await ctx.db.insert("keywords", {
        jobId: args.jobId,
        text: text,
        isMatched: false,
        isManuallyAdded: args.isManuallyAdded,
        createdAt: Date.now(),
      });
      results.push(id);
    }
    return results;
  },
});

export const markAsMatched = mutation({
  args: { id: v.id("keywords"), isMatched: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isMatched: args.isMatched,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("keywords") },
  handler: async (ctx, args) => {
    // Delete associated phrases first
    const phrases = await ctx.db
      .query("phrases")
      .withIndex("by_keyword", (q) => q.eq("keywordId", args.id))
      .collect();
    
    for (const phrase of phrases) {
      await ctx.db.delete(phrase._id);
    }
    
    await ctx.db.delete(args.id);
  },
});