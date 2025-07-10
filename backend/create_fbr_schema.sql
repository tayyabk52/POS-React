-- FBR Integrated POS System Database Schema
-- This script creates all tables and indexes required for FBR compliance

-- ENUM types
CREATE TYPE invoice_type_enum AS ENUM (
    'PURCHASE',       -- 1: Purchase for returns
    'SALE',           -- 2: Sale invoice
    'DEBIT_NOTE',     -- 3: Debit Note
    'CREDIT_NOTE'     -- 4: Credit Note
);

CREATE TYPE fbr_status_enum AS ENUM (
    'PENDING',
    'SENT',
    'SUCCESS',
    'FAILED'
);

-- Branches (Outlets)
CREATE TABLE branches (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    address         TEXT,
    city            VARCHAR(50),
    province        VARCHAR(50),
    ntn             CHAR(7) NOT NULL,
    strn            CHAR(7) NOT NULL,
    fbr_branch_code VARCHAR(20) UNIQUE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS Devices
CREATE TABLE devices (
    id                 SERIAL PRIMARY KEY,
    branch_id          INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name               VARCHAR(100) NOT NULL,
    device_identifier  VARCHAR(100) UNIQUE NOT NULL,
    fbr_pos_reg        VARCHAR(20) UNIQUE NOT NULL,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories (Product Hierarchy)
CREATE TABLE categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    parent_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL
);

-- Tax Rates
CREATE TABLE tax_rates (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL,
    rate    NUMERIC(5,2) NOT NULL,
    code    VARCHAR(20)    -- FBR SRO Schedule code
);

-- Products
CREATE TABLE products (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(50) UNIQUE NOT NULL,
    name         VARCHAR(150) NOT NULL,
    category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    price        NUMERIC(12,2) NOT NULL,
    tax_id       INTEGER REFERENCES tax_rates(id) ON DELETE SET NULL,
    hs_code      VARCHAR(20),       -- FBR Harmonized System Code
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers (Optional)
CREATE TABLE customers (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(150) NOT NULL,
    ntn       VARCHAR(9),            -- NTN or CNIC
    phone     VARCHAR(20),
    address   TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales / Invoices
CREATE TABLE sales (
    id                  SERIAL PRIMARY KEY,
    invoice_no          VARCHAR(30) NOT NULL,
    branch_id           INTEGER NOT NULL REFERENCES branches(id),
    device_id           INTEGER NOT NULL REFERENCES devices(id),
    customer_id         INTEGER REFERENCES customers(id),
    invoice_date        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    invoice_type        invoice_type_enum NOT NULL,
    sale_type_code      VARCHAR(20) NOT NULL,   -- e.g. 'T1000017'
    seller_ntn          CHAR(7) NOT NULL,
    seller_strn         CHAR(7) NOT NULL,
    buyer_ntn           VARCHAR(9),            -- optional
    buyer_name          VARCHAR(150),          -- optional
    total_qty           NUMERIC(10,2) NOT NULL,
    total_sales_value   NUMERIC(14,2) NOT NULL,
    total_tax           NUMERIC(14,2) NOT NULL,
    total_discount      NUMERIC(14,2) DEFAULT 0,
    total_amount        NUMERIC(14,2) NOT NULL,
    usin                VARCHAR(50) UNIQUE NOT NULL,
    fbr_invoice_no      VARCHAR(50) UNIQUE,
    qr_payload          TEXT,
    fbr_payload         JSONB,
    fbr_response        JSONB,
    fbr_status          fbr_status_enum NOT NULL DEFAULT 'PENDING',
    sync_attempts       INTEGER NOT NULL DEFAULT 0,
    last_synced_at      TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale Items (Line Items)
CREATE TABLE sale_items (
    id                    SERIAL PRIMARY KEY,
    sale_id               INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id            INTEGER NOT NULL REFERENCES products(id),
    hs_code               VARCHAR(20),
    quantity              NUMERIC(10,2) NOT NULL,
    unit_price            NUMERIC(12,2) NOT NULL,
    value_excl_tax        NUMERIC(14,2) NOT NULL,
    sales_tax             NUMERIC(14,2) NOT NULL,
    further_tax           NUMERIC(14,2) DEFAULT 0,
    c_v_t                 NUMERIC(14,2) DEFAULT 0,
    w_h_tax_1             NUMERIC(14,2) DEFAULT 0,
    w_h_tax_2             NUMERIC(14,2) DEFAULT 0,
    discount              NUMERIC(14,2) DEFAULT 0,
    sro_item_serial_no    VARCHAR(10),
    line_total            NUMERIC(14,2) NOT NULL,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id            SERIAL PRIMARY KEY,
    sale_id       INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    method        VARCHAR(30) NOT NULL,  -- e.g., 'Cash', 'Card'
    amount        NUMERIC(14,2) NOT NULL,
    payment_date  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    details       JSONB                   -- additional info (card type, transaction ID)
);

-- Audit Log (Optional)
CREATE TABLE invoice_sync_log (
    id            SERIAL PRIMARY KEY,
    sale_id       INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    attempt_no    INTEGER NOT NULL,
    payload       JSONB,
    response      JSONB,
    status        fbr_status_enum NOT NULL,
    attempted_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Users (System Users for POS Management)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    hashed_password VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_sales_invoice_no ON sales(invoice_no);
CREATE INDEX idx_sales_fbr_status ON sales(fbr_status);
CREATE INDEX idx_sales_usin ON sales(usin);
CREATE INDEX idx_sales_branch_id ON sales(branch_id);
CREATE INDEX idx_sales_device_id ON sales(device_id);
CREATE INDEX idx_sales_invoice_date ON sales(invoice_date);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_payments_sale_id ON payments(sale_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_devices_branch_id ON devices(branch_id);
CREATE INDEX idx_devices_fbr_pos_reg ON devices(fbr_pos_reg);
CREATE INDEX idx_branches_fbr_branch_code ON branches(fbr_branch_code);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Insert default tax rates
INSERT INTO tax_rates (name, rate, code) VALUES 
('Standard Rate', 17.00, 'SRO-1'),
('Zero Rate', 0.00, 'SRO-2'),
('Exempt', 0.00, 'SRO-3');

-- Insert default categories
INSERT INTO categories (name) VALUES 
('General'),
('Electronics'),
('Clothing'),
('Food & Beverages'),
('Home & Garden');

-- Insert sample branch (update with your actual data)
INSERT INTO branches (name, address, city, province, ntn, strn, fbr_branch_code) VALUES 
('Main Branch', '123 Main Street', 'Karachi', 'Sindh', '1234567', '7654321', 'BR001');

-- Insert sample device (update with your actual data)
INSERT INTO devices (branch_id, name, device_identifier, fbr_pos_reg) VALUES 
(1, 'POS Terminal 1', 'DEV001', 'POS001');

-- End of schema 