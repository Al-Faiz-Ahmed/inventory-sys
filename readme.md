# Inventory System – Setup Guide

This guide explains how to install, configure, and run the Inventory System (backend + frontend) on your local machine.

------------------------------------------------------------
Prerequisites (Install These First)
------------------------------------------------------------

Make sure the following software is installed and added to your system environment PATH:

- PostgreSQL 16
- Python
- Node.js (LTS version)
- Yarn
- Chrome Browser
- Git

------------------------------------------------------------
Project Structure
------------------------------------------------------------

inventory-sys/
 ├── backend/
 ├── frontend/
 ├── shared/
 └── package.json

------------------------------------------------------------
1. Install All Dependencies
------------------------------------------------------------

Open CMD inside the inventory-sys folder and run:

yarn install-all

This installs all backend and frontend dependencies automatically.

------------------------------------------------------------
2. Create Backend Environment File
------------------------------------------------------------

Create the file:

inventory-sys/backend/.env

Add the following values:

DATABASE_URL=postgresql://[username]:[password]@localhost:5432/[DATABASE_NAME]
PORT=4000
JWT_SECRET=please_change_this_to_a_strong_secret_in_prod
JWT_EXPIRES_IN=30d

Replace the username, password, and database name with your actual PostgreSQL details.

------------------------------------------------------------
3. Generate and Migrate Database Tables
------------------------------------------------------------

Run this command in CMD:

cd backend && yarn db:generate && yarn db:migrate && cd..

This will create all database tables inside your PostgreSQL database.

------------------------------------------------------------
4. Insert Default Expense Categories
------------------------------------------------------------

Open pgAdmin, connect to your database, and execute this SQL script:

INSERT INTO expense_categories (name, description) VALUES
('Office Rent', 'Monthly rent for office or shop premises'),
('Utilities', 'Electricity, gas, water bills'),
('Internet & Telephone', 'WiFi and communication expenses'),
('Vehicle Fuel', 'Fuel for company vehicles'),
('Staff Salaries', 'Monthly salaries for employees'),
('Warehouse Rent', 'Rent for warehouse or storage'),
('Bank Charges', 'Bank fees and charges'),
('Packaging Materials', 'Boxes, tapes, labels, etc.'),
('Software Subscriptions', 'Monthly tools or SaaS fees'),
('Maintenance', 'Repairs and maintenance costs'),
('Legal Fees', 'Lawyer or consultancy fees'),
('Insurance', 'Business, stock, or vehicle insurance'),
('Website & Hosting', 'Domain, hosting, and server costs'),
('Miscellaneous', 'Other small expenses not categorized');

------------------------------------------------------------
5. Build and Start Backend
------------------------------------------------------------

Build backend:

cd backend && yarn build

Start backend:

cd backend && yarn start

------------------------------------------------------------
6. Build and Preview Frontend
------------------------------------------------------------

Build frontend:

cd frontend && yarn build

Preview frontend:

cd frontend && yarn preview

------------------------------------------------------------
Done
------------------------------------------------------------

Your Inventory Management System backend and frontend should now be running locally.