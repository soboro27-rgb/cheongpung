import { NewQuotationForm } from "@/components/quotation/new-quotation-form";

export default function NewQuotationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">견적 신규작성</h1>
        <p className="text-muted-foreground text-sm mt-1">
          고객사 자산 리스트를 입력하고 견적을 산출합니다
        </p>
      </div>
      <NewQuotationForm />
    </div>
  );
}
