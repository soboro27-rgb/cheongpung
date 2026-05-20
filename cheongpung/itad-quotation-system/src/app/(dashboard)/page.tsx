import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus, FileText, Database, History } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm mt-1">
          IT 자산 매각 견적 자동화 시스템
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/quotations/new">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <FilePlus className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">견적 신규작성</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                고객사 자산 리스트를 업로드하고 견적을 산출합니다
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quotations">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">견적 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                작성된 견적서를 조회하고 관리합니다
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/assets">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">자산 마스터</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                표준화된 모델 정보를 관리합니다
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/history">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">거래 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                과거 매각·입찰 이력을 조회합니다
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
