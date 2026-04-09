# CLAUDE.md - メリリーカフェ管理システム

## 1. プロジェクト概要
メリリーカフェの運営を効率化するための包括的社内管理システム。
PCでの管理業務を主軸としつつ、店舗スタッフがiPad等で操作することを想定したレスポンシブなウェブアプリ。

## 2. 組織構成（権限分離の基準）
1. **会計・経営戦略ユニット**: 財務管理、経営分析
2. **商品開発ユニット**: レシピ管理、原価計算
3. **広報・マーケティングユニット**: 広報、キャンペーン管理
4. **システムユニット**: ユーザー管理、マスタ設定（DBからのユーザー登録）
5. **店舗スタッフユニット**: 日々の現場操作、報告

## 3. 技術スタック
- **Framework**: Next.js 16 (App Router, TypeScript, Turbopack)
- **Infrastructure**: Vercel
- **Database/Auth**: Supabase (@supabase/ssr)
- **Collaboration**: Microsoft Teams連携（通知・承認フロー）
- **UI/Styling**: Tailwind CSS v4, lucide-react, clsx, tailwind-merge
- **Theme**: next-themes (ライト/ダークモード)

## 3a. 重要な実装メモ
- Next.js 16 では `middleware.ts` が廃止 → `proxy.ts` に移行済み。エクスポート名も `middleware` → `proxy` に変更。
- Tailwind v4 はファイルベース設定なし。`globals.css` 内の `@custom-variant dark` でクラス戦略を定義。
- `proxy.ts` の `config.matcher` で公開パス以外の全ルートを認証チェック対象にしている。
- テーマトグルは `app/(dashboard)/layout.tsx` の `useEffect` で `window.matchMedia('(min-width: 1024px)')` を監視し、lg未満では `setTheme('system')` を強制。

## 4. UI/UX ガイドライン
- **カラースキーム**: モノトーン（白/黒）ベース、アクセントカラーは青。
- **テーマ制御**: 
  - PC (lg以上): 手動トグルスイッチによる切り替え。
  - スマホ/iPad: デバイス設定（system）に強制従属。トグルは非表示。
- **PC画面レイアウト (3ペイン + ナビ)**:
  - **左欄ナビ**: アイコンのみ。ホバーでタブ名表示。
  - **左ペイン**: タブ内の詳細ナビゲーションエリア。
  - **中央ペイン**: メイン表示エリア（ホームではカレンダー、売上サマリーを表示）。
  - **右ペイン**: データ入力・アクションエリア。

## 5. 開発コマンド
- 起動: `npm run dev`
- ビルド: `npm run build`
- Lint: `npm run lint`

## 6. コーディング規約
- コンポーネントは `components/` に配置。機能ごとにディレクトリを分ける。
- 型定義は `types/` またはコンポーネント内。
- SupabaseのRow Level Security (RLS) を活用し、組織構成に基づいたアクセス制限を行う。
- Teamsへの通知ロジックは将来的に Supabase Edge Functions または API Routes に集約。

## 7. 実装済み/未実装メモ
- [x] 基盤レイアウトの実装 (`app/(dashboard)/layout.tsx`)
- [x] Supabase クライアント基盤 (`utils/supabase/client.ts`, `server.ts`, `middleware.ts`)
- [x] 認証プロキシ (`proxy.ts`) - 未認証時 /login へリダイレクト
- [x] テーマ制御ロジック (next-themes + メディアクエリ連動)
- [x] ログイン画面 (`app/login/page.tsx`)
- [x] ホーム画面 (`app/(dashboard)/page.tsx`) - カレンダー・売上サマリーダミーUI
- [ ] Supabase Auth 本番接続 (`.env.local` に実際のキーを設定)
- [ ] 各ユニットごとのタブページ作成 (会計/商品/広報/システム/店舗)
- [ ] 左ペイン・右ペインのサブナビ実装
- [ ] RLS ポリシー設定
