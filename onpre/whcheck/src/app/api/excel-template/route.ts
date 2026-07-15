import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("수취인명단");
  ws.columns = [
    { header: "이름*", key: "name", width: 14 },
    { header: "전화번호*", key: "phone", width: 18 },
    { header: "배송주소*", key: "address", width: 40 },
    { header: "메모(선택)", key: "memo", width: 20 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.addRow({ name: "홍길동", phone: "01012345678", address: "서울시 강남구 테헤란로 123", memo: "" });
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as Buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename*=UTF-8''%EC%88%98%EC%B7%A8%EC%9D%B8%EB%AA%85%EB%8B%A8_%ED%85%9C%ED%94%8C%EB%A6%BF.xlsx",
    },
  });
}
