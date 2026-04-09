import { createClient } from "@/utils/supabase/server";
import MediaClient from "./_components/MediaClient";
import type { MediaAsset } from "@/types/marketing";

export default async function MediaPage() {
  let assets: MediaAsset[] = [];
  let bucketUrl = "";
  let dbError = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });
    assets = (data ?? []) as MediaAsset[];

    // バケット存在確認 → 存在する場合のみ公開URLベースを設定
    const { error: bucketErr } = await supabase.storage.getBucket("marketing");
    if (!bucketErr) {
      const { data: urlData } = supabase.storage.from("marketing").getPublicUrl("_");
      bucketUrl = urlData.publicUrl.replace("/_", "");
    }
  } catch {
    dbError = true;
  }

  return <MediaClient assets={assets} bucketUrl={bucketUrl} dbError={dbError} />;
}
