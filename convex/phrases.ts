import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("phrases")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
  },
});

export const listByKeyword = query({
  args: { keywordId: v.id("keywords") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("phrases")
      .withIndex("by_keyword", (q) => q.eq("keywordId", args.keywordId))
      .collect();
  },
});

export const create = mutation({
  args: {
    jobId: v.id("jobs"),
    keywordId: v.id("keywords"),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("saved")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const phraseId = await ctx.db.insert("phrases", {
      jobId: args.jobId,
      keywordId: args.keywordId,
      content: args.content,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
    
    // If status is "saved", mark the keyword as matched
    if (args.status === "saved") {
      await ctx.db.patch(args.keywordId, {
        isMatched: true,
      });
    }
    
    return phraseId;
  },
});

export const update = mutation({
  args: {
    id: v.id("phrases"),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("saved"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Phrase not found");
    }
    
    const updates: {
      content?: string;
      status?: "draft" | "saved";
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };
    
    if (args.content !== undefined) {
      updates.content = args.content;
    }
    
    if (args.status !== undefined) {
      updates.status = args.status;
      
      // If status is "saved", mark the keyword as matched
      if (args.status === "saved") {
        await ctx.db.patch(existing.keywordId, {
          isMatched: true,
        });
      }
    }
    
    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("phrases") },
  handler: async (ctx, args) => {
    const phrase = await ctx.db.get(args.id);
    if (!phrase) {
      throw new Error("Phrase not found");
    }
    
    await ctx.db.delete(args.id);
    
    // Check if there are any other saved phrases for this keyword
    const remainingPhrases = await ctx.db
      .query("phrases")
      .withIndex("by_keyword", (q) => q.eq("keywordId", phrase.keywordId))
      .filter((q) => q.eq(q.field("status"), "saved"))
      .collect();
    
    // If no saved phrases remain, unmark the keyword
    if (remainingPhrases.length === 0) {
      await ctx.db.patch(phrase.keywordId, {
        isMatched: false,
      });
    }
  },
});