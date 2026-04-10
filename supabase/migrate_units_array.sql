-- profiles.unit を TEXT[] に変更（複数ユニット対応）
-- Supabase SQL Editor で実行してください

-- 1. まずデフォルト値を削除
ALTER TABLE profiles ALTER COLUMN unit DROP DEFAULT;

-- 2. カラム名変更 & 型変換
ALTER TABLE profiles RENAME COLUMN unit TO units;
ALTER TABLE profiles ALTER COLUMN units TYPE TEXT[] USING ARRAY[units];

-- 3. 新しいデフォルト値を設定
ALTER TABLE profiles ALTER COLUMN units SET DEFAULT ARRAY['店舗スタッフ']::TEXT[];
