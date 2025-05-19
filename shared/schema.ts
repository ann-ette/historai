import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Historical Figures
export const historicalFigures = pgTable("historical_figures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull().unique(),
  imageSrc: text("image_src").notNull(),
  videoSrc: text("video_src"),
  agentKey: text("agent_key").notNull(),
  active: boolean("active").default(false),
});

export const insertHistoricalFigureSchema = createInsertSchema(historicalFigures).omit({
  id: true,
});

export type InsertHistoricalFigure = z.infer<typeof insertHistoricalFigureSchema>;
export type HistoricalFigure = typeof historicalFigures.$inferSelect;

// Conversations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  figureId: integer("figure_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' or 'historical-figure'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
