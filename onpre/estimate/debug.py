import openpyxl
wb = openpyxl.load_workbook('data/카카오뱅크견적서송부_20260511.xlsx', data_only=True)
ws = wb.active

# 행 10~20 전체 컬럼값 출력 (0-indexed 컬럼 위치 확인)
print("행별 전체 컬럼 (인덱스:값) 형태로 출력")
for ri in range(10, 30):
    row = list(ws.iter_rows(min_row=ri, max_row=ri, values_only=True))[0]
    non_null = {ci: v for ci, v in enumerate(row) if v is not None}
    if non_null:
        print(f"\n행 {ri}:")
        for ci, v in non_null.items():
            print(f"  col[{ci}] = {repr(v)}")
