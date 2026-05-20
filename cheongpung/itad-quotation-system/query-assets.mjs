import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.vkpsbxqcnrwzjghczykm:Yonk1177%21%21%21@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres'
});

await client.connect();

// 1. 카테고리별 건수
const cat = await client.query(
  `SELECT category, COUNT(*) as cnt FROM asset_masters GROUP BY category ORDER BY cnt DESC`
);
console.log('=== 카테고리별 건수 ===');
for (const row of cat.rows) console.log(`  ${String(row.category).padEnd(10)}: ${row.cnt}건`);

// 2. 소매가 35000원 근처 항목
console.log('\n=== 소매가 30,000~40,000원 항목 ===');
const price35 = await client.query(
  `SELECT model_code, model_display_name, spec_summary, category, retail_price_krw
   FROM asset_masters WHERE retail_price_krw BETWEEN 30000 AND 40000
   ORDER BY retail_price_krw, category`
);
console.log(`${price35.rows.length}건`);
for (const row of price35.rows) {
  console.log(`  [${row.category}] ${row.model_code} | ${String(row.model_display_name).substring(0,35)} | ${row.spec_summary || '-'} | ${row.retail_price_krw}`);
}

// 3. OTHER 카테고리 샘플 (CPU 항목)
console.log('\n=== OTHER 카테고리 상위 30건 ===');
const other = await client.query(
  `SELECT model_code, model_display_name, spec_summary, retail_price_krw
   FROM asset_masters WHERE category = 'OTHER'
   ORDER BY model_code LIMIT 30`
);
for (const row of other.rows) {
  console.log(`  ${String(row.model_code).padEnd(20)} | ${String(row.model_display_name).substring(0,40).padEnd(40)} | ${String(row.spec_summary||'-').substring(0,40)} | ${row.retail_price_krw}`);
}

// 4. specSummary 패턴 확인 (CPU 세대 표기 방식)
console.log('\n=== LAPTOP specSummary 예시 20건 ===');
const specs = await client.query(
  `SELECT model_code, spec_summary, retail_price_krw FROM asset_masters
   WHERE category = 'LAPTOP' AND spec_summary IS NOT NULL
   ORDER BY model_code LIMIT 20`
);
for (const row of specs.rows) {
  console.log(`  ${String(row.model_code).padEnd(20)} | ${String(row.spec_summary).substring(0,60)} | ${row.retail_price_krw}`);
}

await client.end();
