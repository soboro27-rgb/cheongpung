import { Suspense } from "react";
import { AssetMasterTable } from "@/components/assets/asset-master-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">자산 마스터</h1>
          <p className="text-muted-foreground text-sm mt-1">표준화된 모델 정보를 관리합니다</p>
        </div>
        <Link href="/assets/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            모델 등록
          </Button>
        </Link>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">로딩 중...</div>}>
        <AssetMasterTable />
      </Suspense>
    </div>
  );
}
