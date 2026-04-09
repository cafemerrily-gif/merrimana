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

    // Supabase Storage のパブリックURL ベース
    const { data: urlData } = supabase.storage.from("marketing").getPublicUrl("_");
    // "_" は存在しないファイルだが URL の構造を取得するために使用
    bucketUrl = urlData.publicUrl.replace("/_", "");
  } catch {
    dbError = true;
  }

  return <MediaClient assets={assets} bucketUrl={bucketUrl} dbError={dbError} />;
}
