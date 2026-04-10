-- profiles.unit を TEXT[] に変更（複数ユニット対応）
-- Supabase SQL Editor で実行してください

ALTER TABLE profiles
  RENAME COLUMN unit TO units;

ALTER TABLE profiles
  ALTER COLUMN units TYPE TEXT[]
  USING ARRAY[units];

ALTER TABLE profiles
  ALTER COLUMN units SET DEFAULT ARRAY['店舗スタッフ']::TEXT[];
