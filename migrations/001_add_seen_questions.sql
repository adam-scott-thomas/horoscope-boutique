-- Migration: Add seen_questions column for cognitive reflection questions
-- Run this on existing databases before deploying the questions feature

-- Add seen_questions column to users table
ALTER TABLE users ADD COLUMN seen_questions TEXT;

-- Column stores JSON array of question IDs user has seen
-- Example: ["q001", "q005", "q012"]
-- Resets automatically when all questions exhausted
