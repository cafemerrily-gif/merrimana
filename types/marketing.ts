export type CampaignStatus = "準備中" | "実施中" | "終了";
export type AdStatus = "準備中" | "実施中" | "終了" | "一時停止";
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

export interface Ad {
  id: string;
  title: string;
  channel: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  cost: number;
  status: AdStatus;
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

export const AD_CHANNELS = [
  "Instagram",
  "X（Twitter）",
  "看板",
  "ポスター",
  "チラシ",
  "Webサイト",
  "Google広告",
  "その他",
] as const;

export const CAMPAIGN_STATUS_OPTIONS: CampaignStatus[] = ["準備中", "実施中", "終了"];
export const AD_STATUS_OPTIONS: AdStatus[] = ["準備中", "実施中", "終了", "一時停止"];
