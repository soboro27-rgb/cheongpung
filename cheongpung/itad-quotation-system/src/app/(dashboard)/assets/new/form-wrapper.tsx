"use client";

import { useRouter } from "next/navigation";
import { AssetMasterForm } from "@/components/assets/asset-master-form";

export default function NewAssetFormWrapper() {
  const router = useRouter();
  return (
    <AssetMasterForm
      onSuccess={() => router.push("/assets")}
      onCancel={() => router.back()}
    />
  );
}
