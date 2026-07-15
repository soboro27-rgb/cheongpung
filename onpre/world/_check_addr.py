import pandas as pd, sys
sys.stdout.reconfigure(encoding='utf-8')
df = pd.read_csv('data/주문 조회모든 주문 상세정보-2026.csv', dtype=str, encoding='utf-8-sig', nrows=3000)
df.rename(columns={'수령자명':'name','주소1':'addr1','주소2':'addr2'}, inplace=True)
sample = df[df['name'].notna() & df['addr1'].notna()][['name','addr1','addr2']].dropna(subset=['addr1']).sample(30, random_state=42)
for _, r in sample.iterrows():
    n = str(r['name'])[:8]
    a1 = str(r['addr1'])[:55]
    a2 = str(r.get('addr2',''))[:30]
    print(f"{n:10} | {a1:55} | {a2}")
