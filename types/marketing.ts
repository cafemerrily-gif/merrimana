export type CampaignStatus = "準備中" | "実施中" | "終了";
export type PrActivityStatus = "予定" | "完了" | "見送り";
export type MediaFileType = "image" | "video" | "pdf" | "other";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  tags: string[];
  created_at: string;
}

export interface PrActivity {
  id: string;
  title: string;
  channel: string;
  description: string;
  scheduled_at: string | null; // DATE string "YYYY-MM-DD"
  status: PrActivityStatus;
  campaign_id: string | null;
  campaign?: Pick<Campaign, "id" | "title">;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  file_path: string;
  file_type: MediaFileType;
  file_size: number;
  mime_type: string;
  tags: string[];
  campaign_id: string | null;
  created_at: string;
}

// 学生カフェ向け：無料・低コストなPRチャネル
export const PR_CHANNELS = [
  "Instagram",
  "TikTok",
  "X（Twitter）",
  "チラシ配布",
  "学内掲示板",
  "口コミ・紹介",
  "イベント参加",
  "LINE",
  "その他",
] as const;

export type PrChannel = (typeof PR_CHANNELS)[number];

export const CAMPAIGN_STATUS_OPTIONS: CampaignStatus[] = ["準備中", "実施中", "終了"];
export const PR_ACTIVITY_STATUS_OPTIONS: PrActivityStatus[] = ["予定", "完了", "見送り"];
