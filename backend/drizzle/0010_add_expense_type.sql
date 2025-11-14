-- Enum for expense type
DO $$ BEGIN
  CREATE TYPE expense_type AS ENUM ('expense','adjustment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add column to expenses
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS expense_type expense_type NOT NULL DEFAULT 'expense';

-- Optional: index for filtering by type
CREATE INDEX IF NOT EXISTS idx_expenses_expense_type ON expenses(expense_type);
