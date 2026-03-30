-- Add translations column to books table
-- This column stores pre-generated translations (title and chapters) in both English and Hebrew

ALTER TABLE books ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN books.translations IS 'Pre-generated translations: {english?: {title, chapters[], generatedAt}, hebrew?: {title, chapters[], generatedAt}}';
