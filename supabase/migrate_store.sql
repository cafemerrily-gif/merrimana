-- タイムカード
CREATE TABLE IF NOT EXISTS timecards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name    text NOT NULL,
  date          date NOT NULL,
  clock_in      timestamptz,
  clock_out     timestamptz,
  break_minutes integer NOT NULL DEFAULT 0,
  notes         text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS timecards_date_idx  ON timecards(date);
CREATE INDEX IF NOT EXISTS timecards_staff_idx ON timecards(staff_name, date);

-- 在庫管理
CREATE TABLE IF NOT EXISTS inventory_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  category         text NOT NULL DEFAULT '',
  unit             text NOT NULL DEFAULT '',
  min_quantity     numeric NOT NULL DEFAULT 0,
  max_quantity     numeric NOT NULL DEFAULT 100,
  current_quantity numeric NOT NULL DEFAULT 0,
  updated_at       timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

-- シフト表
CREATE TABLE IF NOT EXISTS shifts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name text NOT NULL,
  role       text NOT NULL DEFAULT '',
  date       date NOT NULL,
  start_time text NOT NULL,
  end_time   text NOT NULL,
  notes      text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shifts_date_idx ON shifts(date);
