-- 顧客テーブル
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birthday DATE,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 施術メニューテーブル
CREATE TABLE nail_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'その他',
  price DECIMAL(10,2) NOT NULL,
  duration_min INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 予約テーブル
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES nail_menus(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','cancelled')),
  memo TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
