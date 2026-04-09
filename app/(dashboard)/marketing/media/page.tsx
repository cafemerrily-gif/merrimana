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

    // Supabase Storage 公開URLベースを環境変数から直接構築
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      bucketUrl = `${supabaseUrl}/storage/v1/object/public/marketing`;
    }
  } catch {
    dbError = true;
  }

  return <MediaClient assets={assets} bucketUrl={bucketUrl} dbError={dbError} />;
}
