-- Create expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  title VARCHAR(150) NOT NULL,
  expense_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
