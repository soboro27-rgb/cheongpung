import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewAssetFormWrapper from "./form-wrapper";

export default function NewAssetPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">모델 등록</h1>
        <p className="text-muted-foreground text-sm mt-1">새 자산 마스터를 등록합니다</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">자산 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <NewAssetFormWrapper />
        </CardContent>
      </Card>
    </div>
  );
}
