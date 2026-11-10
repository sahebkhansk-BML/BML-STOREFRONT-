-- BML PostgreSQL schema. Run once in your Neon SQL Editor.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_paise BIGINT NOT NULL CHECK (price_paise > 0),
  image_url TEXT,
  category VARCHAR(80) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(140) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_paise BIGINT NOT NULL CHECK (unit_price_paise > 0)
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at DESC);

-- Optional sample products. Prices are stored in paise (₹499 = 49900).
INSERT INTO products (name, description, price_paise, category, stock)
VALUES
 ('Wireless Headphones', 'Everyday audio essentials', 149900, 'Electronics', 10),
 ('Smart Watch', 'Smart wearable for daily use', 229900, 'Electronics', 10),
 ('Everyday Backpack', 'A practical everyday backpack', 89900, 'Accessories', 10)
ON CONFLICT DO NOTHING;

-- After registering your own account, promote it to admin by running this
-- with the exact email you used. Do not make this an API endpoint.
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
