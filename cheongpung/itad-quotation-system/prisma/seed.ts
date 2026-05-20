import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { subDays, subMonths } from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── 고객사 15곳 ──────────────────────────────────────────────
const CUSTOMERS = [
  { name: "국민은행", sector: "FINANCIAL", region: "SEOUL", winRate: 0.72, totalDeals: 18 },
  { name: "우리은행", sector: "FINANCIAL", region: "SEOUL", winRate: 0.65, totalDeals: 12 },
  { name: "신한은행", sector: "FINANCIAL", region: "SEOUL", winRate: 0.80, totalDeals: 22 },
  { name: "하나은행", sector: "FINANCIAL", region: "SEOUL", winRate: 0.58, totalDeals: 9 },
  { name: "새마을금고중앙회", sector: "FINANCIAL", region: "SEOUL", winRate: 0.90, totalDeals: 7 },
  { name: "행정안전부", sector: "PUBLIC", region: "SEJONG", winRate: 0.45, totalDeals: 6 },
  { name: "SK하이닉스", sector: "CORPORATE", region: "SEOUL", winRate: 0.60, totalDeals: 4 },
  { name: "LG전자", sector: "CORPORATE", region: "SEOUL", winRate: 0.55, totalDeals: 3 },
  { name: "삼성SDS", sector: "CORPORATE", region: "SEOUL", winRate: 0.70, totalDeals: 8 },
  { name: "KT", sector: "CORPORATE", region: "SEOUL", winRate: 0.75, totalDeals: 11 },
  { name: "한국전력공사", sector: "PUBLIC", region: "SEJONG", winRate: 0.50, totalDeals: 5 },
  { name: "국민건강보험공단", sector: "PUBLIC", region: "SEOUL", winRate: 0.40, totalDeals: 3 },
  { name: "서울시청", sector: "PUBLIC", region: "SEOUL", winRate: 0.62, totalDeals: 14 },
  { name: "인천광역시청", sector: "PUBLIC", region: "INCHEON", winRate: 0.48, totalDeals: 4 },
  { name: "부산광역시청", sector: "PUBLIC", region: "YEONGNAM", winRate: 0.55, totalDeals: 6 },
] as const;

// ── 자산 마스터 (100종) ───────────────────────────────────────
const ASSET_MASTERS = [
  // 노트북 30종
  { category: "LAPTOP", brand: "LG", modelCode: "LG-14Z90P", modelDisplayName: "LG 그램 14 (14Z90P)", specSummary: "i5-1135G7, 16GB, 512GB SSD", releaseYear: 2021, retailPriceKrw: 1590000 },
  { category: "LAPTOP", brand: "LG", modelCode: "LG-16Z90P", modelDisplayName: "LG 그램 16 (16Z90P)", specSummary: "i7-1165G7, 16GB, 512GB SSD", releaseYear: 2021, retailPriceKrw: 1890000 },
  { category: "LAPTOP", brand: "LG", modelCode: "LG-14Z90Q", modelDisplayName: "LG 그램 14 (14Z90Q)", specSummary: "i5-1240P, 16GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1690000 },
  { category: "LAPTOP", brand: "LG", modelCode: "LG-16Z90Q", modelDisplayName: "LG 그램 16 (16Z90Q)", specSummary: "i7-1260P, 16GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1990000 },
  { category: "LAPTOP", brand: "LG", modelCode: "LG-14Z90R", modelDisplayName: "LG 그램 14 (14Z90R)", specSummary: "i5-1340P, 16GB, 512GB SSD", releaseYear: 2023, retailPriceKrw: 1750000 },
  { category: "LAPTOP", brand: "Samsung", modelCode: "SAM-NT950XEE", modelDisplayName: "삼성 Galaxy Book4 Pro 14", specSummary: "Ultra 5 125H, 16GB, 512GB SSD", releaseYear: 2024, retailPriceKrw: 2090000 },
  { category: "LAPTOP", brand: "Samsung", modelCode: "SAM-NT960XGK", modelDisplayName: "삼성 Galaxy Book3 Pro 16", specSummary: "i7-1360P, 16GB, 512GB SSD", releaseYear: 2023, retailPriceKrw: 1990000 },
  { category: "LAPTOP", brand: "Samsung", modelCode: "SAM-NT760XDA", modelDisplayName: "삼성 Galaxy Book2 15", specSummary: "i5-1235U, 8GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 1190000 },
  { category: "LAPTOP", brand: "HP", modelCode: "HP-840G9", modelDisplayName: "HP EliteBook 840 G9", specSummary: "i5-1245U, 16GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 1850000 },
  { category: "LAPTOP", brand: "HP", modelCode: "HP-840G10", modelDisplayName: "HP EliteBook 840 G10", specSummary: "i7-1355U, 16GB, 512GB SSD", releaseYear: 2023, retailPriceKrw: 2050000 },
  { category: "LAPTOP", brand: "HP", modelCode: "HP-850G9", modelDisplayName: "HP EliteBook 850 G9", specSummary: "i7-1255U, 32GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 2200000 },
  { category: "LAPTOP", brand: "Dell", modelCode: "DELL-LAT5540", modelDisplayName: "Dell Latitude 5540", specSummary: "i5-1345U, 16GB, 256GB SSD", releaseYear: 2023, retailPriceKrw: 1750000 },
  { category: "LAPTOP", brand: "Dell", modelCode: "DELL-LAT5430", modelDisplayName: "Dell Latitude 5430", specSummary: "i5-1235U, 16GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 1650000 },
  { category: "LAPTOP", brand: "Lenovo", modelCode: "LEN-X1C-G10", modelDisplayName: "Lenovo ThinkPad X1 Carbon Gen10", specSummary: "i7-1265U, 16GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 2490000 },
  { category: "LAPTOP", brand: "Lenovo", modelCode: "LEN-X1C-G11", modelDisplayName: "Lenovo ThinkPad X1 Carbon Gen11", specSummary: "i7-1355U, 16GB, 512GB SSD", releaseYear: 2023, retailPriceKrw: 2690000 },
  { category: "LAPTOP", brand: "Lenovo", modelCode: "LEN-T14S-G3", modelDisplayName: "Lenovo ThinkPad T14s Gen3", specSummary: "i5-1235U, 16GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 1890000 },
  { category: "LAPTOP", brand: "ASUS", modelCode: "ASUS-E410MA", modelDisplayName: "ASUS ExpertBook B1 B1500", specSummary: "i5-1135G7, 8GB, 256GB SSD", releaseYear: 2021, retailPriceKrw: 1050000 },
  { category: "LAPTOP", brand: "Apple", modelCode: "APPLE-MBA-M1", modelDisplayName: "Apple MacBook Air M1", specSummary: "Apple M1, 8GB, 256GB SSD", releaseYear: 2020, retailPriceKrw: 1490000 },
  { category: "LAPTOP", brand: "Apple", modelCode: "APPLE-MBA-M2", modelDisplayName: "Apple MacBook Air M2", specSummary: "Apple M2, 8GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 1590000 },
  { category: "LAPTOP", brand: "Microsoft", modelCode: "MS-SP8-I5", modelDisplayName: "Microsoft Surface Pro 8 i5", specSummary: "i5-1135G7, 8GB, 256GB SSD", releaseYear: 2021, retailPriceKrw: 1590000 },
  { category: "LAPTOP", brand: "LG", modelCode: "LG-15Z95P", modelDisplayName: "LG 그램 15 (15Z95P)", specSummary: "i7-1195G7, 16GB, 512GB SSD", releaseYear: 2021, retailPriceKrw: 1890000 },
  { category: "LAPTOP", brand: "HP", modelCode: "HP-PROBOOK450G9", modelDisplayName: "HP ProBook 450 G9", specSummary: "i5-1235U, 8GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 1250000 },
  { category: "LAPTOP", brand: "Dell", modelCode: "DELL-LAT7540", modelDisplayName: "Dell Latitude 7540", specSummary: "i7-1365U, 32GB, 512GB SSD", releaseYear: 2023, retailPriceKrw: 2450000 },
  { category: "LAPTOP", brand: "Lenovo", modelCode: "LEN-E15-G4", modelDisplayName: "Lenovo ThinkPad E15 Gen4", specSummary: "i5-1235U, 16GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 1390000 },
  { category: "LAPTOP", brand: "HP", modelCode: "HP-ZB14-G9", modelDisplayName: "HP ZBook Firefly 14 G9", specSummary: "i7-1265U, 32GB, 1TB SSD", releaseYear: 2022, retailPriceKrw: 2990000 },
  { category: "LAPTOP", brand: "Dell", modelCode: "DELL-LAT5340", modelDisplayName: "Dell Latitude 5340", specSummary: "i5-1335U, 8GB, 256GB SSD", releaseYear: 2023, retailPriceKrw: 1550000 },
  { category: "LAPTOP", brand: "Samsung", modelCode: "SAM-NT550XED", modelDisplayName: "삼성 Galaxy Book2 360 13", specSummary: "i5-1235U, 8GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 1390000 },
  { category: "LAPTOP", brand: "Lenovo", modelCode: "LEN-YOGA7-G7", modelDisplayName: "Lenovo IdeaPad Yoga 7 Gen7", specSummary: "Ryzen 5 6600U, 16GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1490000 },
  { category: "LAPTOP", brand: "HP", modelCode: "HP-ENVY-X360-15", modelDisplayName: "HP ENVY x360 15", specSummary: "Ryzen 5 5625U, 16GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1290000 },
  { category: "LAPTOP", brand: "LG", modelCode: "LG-17Z90P", modelDisplayName: "LG 그램 17 (17Z90P)", specSummary: "i7-1165G7, 16GB, 512GB SSD", releaseYear: 2021, retailPriceKrw: 2090000 },

  // 데스크탑 25종
  { category: "DESKTOP", brand: "HP", modelCode: "HP-PD400G9-MT", modelDisplayName: "HP ProDesk 400 G9 MT", specSummary: "i5-12500, 8GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 980000 },
  { category: "DESKTOP", brand: "HP", modelCode: "HP-PD600G9-MT", modelDisplayName: "HP ProDesk 600 G9 MT", specSummary: "i7-12700, 16GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1350000 },
  { category: "DESKTOP", brand: "HP", modelCode: "HP-ED800G9-SFF", modelDisplayName: "HP EliteDesk 800 G9 SFF", specSummary: "i7-12700, 32GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1750000 },
  { category: "DESKTOP", brand: "Dell", modelCode: "DELL-OP3090-MT", modelDisplayName: "Dell OptiPlex 3090 MT", specSummary: "i5-10505, 8GB, 256GB SSD", releaseYear: 2021, retailPriceKrw: 870000 },
  { category: "DESKTOP", brand: "Dell", modelCode: "DELL-OP7010-MT", modelDisplayName: "Dell OptiPlex 7010 MT", specSummary: "i7-12700, 16GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1450000 },
  { category: "DESKTOP", brand: "Dell", modelCode: "DELL-OP3000-MT", modelDisplayName: "Dell OptiPlex 3000 MT", specSummary: "i5-12500T, 8GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 990000 },
  { category: "DESKTOP", brand: "Lenovo", modelCode: "LEN-M70Q-G3", modelDisplayName: "Lenovo ThinkCentre M70q Gen3", specSummary: "i5-12400T, 8GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 920000 },
  { category: "DESKTOP", brand: "Lenovo", modelCode: "LEN-M80S-G3", modelDisplayName: "Lenovo ThinkCentre M80s Gen3", specSummary: "i7-12700, 16GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1390000 },
  { category: "DESKTOP", brand: "Lenovo", modelCode: "LEN-M90T-G3", modelDisplayName: "Lenovo ThinkCentre M90t Gen3", specSummary: "i9-12900, 32GB, 512GB SSD", releaseYear: 2022, retailPriceKrw: 1890000 },
  { category: "DESKTOP", brand: "Samsung", modelCode: "SAM-DB400S7A", modelDisplayName: "삼성 DM500S7A", specSummary: "i5-12400, 8GB, 256GB SSD", releaseYear: 2022, retailPriceKrw: 890000 },
  { category: "DESKTOP", brand: "HP", modelCode: "HP-PD400G8-SFF", modelDisplayName: "HP ProDesk 400 G8 SFF", specSummary: "i5-11500, 8GB, 256GB SSD", releaseYear: 2021, retailPriceKrw: 920000 },
  { category: "DESKTOP", brand: "Dell", modelCode: "DELL-OP5090-SFF", modelDisplayName: "Dell OptiPlex 5090 SFF", specSummary: "i5-10500, 8GB, 256GB SSD", releaseYear: 2021, retailPriceKrw: 970000 },
  { category: "DESKTOP", brand: "HP", modelCode: "HP-PD400G7-MT", modelDisplayName: "HP ProDesk 400 G7 MT", specSummary: "i5-10500, 8GB, 256GB SSD", releaseYear: 2020, retailPriceKrw: 850000 },
  { category: "DESKTOP", brand: "Lenovo", modelCode: "LEN-M720T-G2", modelDisplayName: "Lenovo ThinkCentre M720t", specSummary: "i5-9400, 8GB, 256GB SSD", releaseYear: 2019, retailPriceKrw: 870000 },
  { category: "DESKTOP", brand: "Dell", modelCode: "DELL-OP3080-SFF", modelDisplayName: "Dell OptiPlex 3080 SFF", specSummary: "i5-10500T, 8GB, 256GB SSD", releaseYear: 2020, retailPriceKrw: 820000 },
  { category: "DESKTOP", brand: "HP", modelCode: "HP-PD600G8-SFF", modelDisplayName: "HP ProDesk 600 G8 SFF", specSummary: "i7-11700, 16GB, 512GB SSD", releaseYear: 2021, retailPriceKrw: 1290000 },
  { category: "DESKTOP", brand: "Dell", modelCode: "DELL-OP7090-MT", modelDisplayName: "Dell OptiPlex 7090 MT", specSummary: "i7-11700, 16GB, 512GB SSD", releaseYear: 2021, retailPriceKrw: 1350000 },
  { category: "DESKTOP", brand: "Lenovo", modelCode: "LEN-M70Q-G2", modelDisplayName: "Lenovo ThinkCentre M70q Gen2", specSummary: "i5-11400T, 8GB, 256GB SSD", releaseYear: 2021, retailPriceKrw: 870000 },
  { category: "DESKTOP", brand: "HP", modelCode: "HP-Z2G9-SFF", modelDisplayName: "HP Z2 G9 SFF Workstation", specSummary: "i9-12900K, 64GB, 1TB SSD", releaseYear: 2022, retailPriceKrw: 3200000 },
  { category: "DESKTOP", brand: "Dell", modelCode: "DELL-PREC3660-MT", modelDisplayName: "Dell Precision 3660 MT", specSummary: "i9-12900K, 64GB, 2TB SSD", releaseYear: 2022, retailPriceKrw: 3500000 },
  { category: "DESKTOP", brand: "Apple", modelCode: "APPLE-MAC-MINI-M1", modelDisplayName: "Apple Mac mini M1", specSummary: "Apple M1, 8GB, 256GB SSD", releaseYear: 2020, retailPriceKrw: 830000 },
  { category: "DESKTOP", brand: "HP", modelCode: "HP-ED800G8-SFF", modelDisplayName: "HP EliteDesk 800 G8 SFF", specSummary: "i7-11700, 32GB, 512GB SSD", releaseYear: 2021, retailPriceKrw: 1650000 },
  { category: "DESKTOP", brand: "Lenovo", modelCode: "LEN-M90Q-G2", modelDisplayName: "Lenovo ThinkCentre M90q Gen2", specSummary: "i7-11700, 16GB, 512GB SSD", releaseYear: 2021, retailPriceKrw: 1350000 },
  { category: "DESKTOP", brand: "Samsung", modelCode: "SAM-DM500S8A", modelDisplayName: "삼성 DM500S8A", specSummary: "i5-11400, 16GB, 256GB SSD", releaseYear: 2021, retailPriceKrw: 970000 },
  { category: "DESKTOP", brand: "Dell", modelCode: "DELL-OP5080-MT", modelDisplayName: "Dell OptiPlex 5080 MT", specSummary: "i5-10500, 16GB, 512GB SSD", releaseYear: 2020, retailPriceKrw: 990000 },

  // 서버 20종
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R750-16S", modelDisplayName: "Dell PowerEdge R750 (16코어)", specSummary: "Xeon Silver 4314×2, 128GB, 2.4TB SAS", releaseYear: 2021, retailPriceKrw: 12000000 },
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R650-8S", modelDisplayName: "Dell PowerEdge R650 (8코어)", specSummary: "Xeon Silver 4310×2, 64GB, 1.2TB SAS", releaseYear: 2021, retailPriceKrw: 8500000 },
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R640-12S", modelDisplayName: "Dell PowerEdge R640 (12코어)", specSummary: "Xeon Silver 4214R×2, 96GB, 1.8TB SAS", releaseYear: 2020, retailPriceKrw: 9800000 },
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R440-8S", modelDisplayName: "Dell PowerEdge R440 (8코어)", specSummary: "Xeon Silver 4210R, 32GB, 480GB SSD", releaseYear: 2020, retailPriceKrw: 5500000 },
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R840-32S", modelDisplayName: "Dell PowerEdge R840 (32코어)", specSummary: "Xeon Gold 6230×4, 256GB, 3.6TB SAS", releaseYear: 2019, retailPriceKrw: 35000000 },
  { category: "SERVER", brand: "HP", modelCode: "HPE-DL380G10-16S", modelDisplayName: "HPE ProLiant DL380 Gen10 (16코어)", specSummary: "Xeon Silver 4314×2, 128GB, 2.4TB SAS", releaseYear: 2021, retailPriceKrw: 13000000 },
  { category: "SERVER", brand: "HP", modelCode: "HPE-DL360G10-8S", modelDisplayName: "HPE ProLiant DL360 Gen10 (8코어)", specSummary: "Xeon Silver 4210R, 64GB, 960GB SSD", releaseYear: 2020, retailPriceKrw: 7500000 },
  { category: "SERVER", brand: "HP", modelCode: "HPE-DL380G9-16S", modelDisplayName: "HPE ProLiant DL380 Gen9 (16코어)", specSummary: "Xeon E5-2640v4×2, 64GB, 1.2TB SAS", releaseYear: 2016, retailPriceKrw: 9000000 },
  { category: "SERVER", brand: "Lenovo", modelCode: "LEN-SR650-16S", modelDisplayName: "Lenovo ThinkSystem SR650 (16코어)", specSummary: "Xeon Silver 4314×2, 128GB, 2.4TB SAS", releaseYear: 2021, retailPriceKrw: 12500000 },
  { category: "SERVER", brand: "Lenovo", modelCode: "LEN-SR630-8S", modelDisplayName: "Lenovo ThinkSystem SR630 (8코어)", specSummary: "Xeon Silver 4210R, 32GB, 480GB SSD", releaseYear: 2020, retailPriceKrw: 6500000 },
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R550-16S", modelDisplayName: "Dell PowerEdge R550 (16코어)", specSummary: "Xeon Silver 4314×2, 128GB, 1.6TB SSD", releaseYear: 2021, retailPriceKrw: 11500000 },
  { category: "SERVER", brand: "HP", modelCode: "HPE-ML350G10-12S", modelDisplayName: "HPE ProLiant ML350 Gen10 (12코어)", specSummary: "Xeon Silver 4214R, 64GB, 1.2TB SAS", releaseYear: 2020, retailPriceKrw: 8900000 },
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R740-24S", modelDisplayName: "Dell PowerEdge R740 (24코어)", specSummary: "Xeon Gold 6240×2, 192GB, 7.2TB SAS", releaseYear: 2019, retailPriceKrw: 22000000 },
  { category: "SERVER", brand: "HP", modelCode: "HPE-DL180G10-16S", modelDisplayName: "HPE ProLiant DL180 Gen10 (16코어)", specSummary: "Xeon Silver 4216, 64GB, 1.2TB SAS", releaseYear: 2019, retailPriceKrw: 6800000 },
  { category: "SERVER", brand: "Lenovo", modelCode: "LEN-ST650-16S", modelDisplayName: "Lenovo ThinkSystem ST650 V2 (16코어)", specSummary: "Xeon Silver 4314×2, 128GB, 2.4TB SAS", releaseYear: 2021, retailPriceKrw: 14000000 },
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R750XS-12S", modelDisplayName: "Dell PowerEdge R750xs (12코어)", specSummary: "Xeon Gold 5318Y, 64GB, 960GB SSD", releaseYear: 2021, retailPriceKrw: 9500000 },
  { category: "SERVER", brand: "HP", modelCode: "HPE-DL560G10-48S", modelDisplayName: "HPE ProLiant DL560 Gen10 (48코어)", specSummary: "Xeon Gold 6240×4, 384GB, 3.6TB SAS", releaseYear: 2019, retailPriceKrw: 45000000 },
  { category: "SERVER", brand: "Dell", modelCode: "DELL-R430-8S", modelDisplayName: "Dell PowerEdge R430 (8코어)", specSummary: "Xeon E5-2630v4, 32GB, 600GB SAS", releaseYear: 2017, retailPriceKrw: 5000000 },
  { category: "SERVER", brand: "Lenovo", modelCode: "LEN-SR590-16S", modelDisplayName: "Lenovo ThinkSystem SR590 (16코어)", specSummary: "Xeon Silver 4214R×2, 64GB, 1.2TB SAS", releaseYear: 2020, retailPriceKrw: 8000000 },
  { category: "SERVER", brand: "HP", modelCode: "HPE-DL20G10-4S", modelDisplayName: "HPE ProLiant DL20 Gen10 Plus", specSummary: "Xeon E-2336, 16GB, 2×480GB SSD", releaseYear: 2021, retailPriceKrw: 3200000 },

  // 모니터 10종
  { category: "MONITOR", brand: "Dell", modelCode: "DELL-P2422H", modelDisplayName: "Dell P2422H 24인치 FHD", specSummary: "24인치, FHD 1920×1080, IPS, 60Hz", releaseYear: 2021, retailPriceKrw: 340000 },
  { category: "MONITOR", brand: "Dell", modelCode: "DELL-P2422H-23", modelDisplayName: "Dell P2422H (2023)", specSummary: "24인치, FHD 1920×1080, IPS, 60Hz", releaseYear: 2023, retailPriceKrw: 360000 },
  { category: "MONITOR", brand: "LG", modelCode: "LG-27UK850", modelDisplayName: "LG 27UK850 4K", specSummary: "27인치, UHD 3840×2160, IPS, 60Hz, USB-C", releaseYear: 2018, retailPriceKrw: 650000 },
  { category: "MONITOR", brand: "LG", modelCode: "LG-27BN650", modelDisplayName: "LG 27BN650 QHD", specSummary: "27인치, QHD 2560×1440, IPS, 75Hz", releaseYear: 2020, retailPriceKrw: 420000 },
  { category: "MONITOR", brand: "Samsung", modelCode: "SAM-S24F350", modelDisplayName: "삼성 S24F350 24인치", specSummary: "24인치, FHD 1920×1080, VA, 60Hz", releaseYear: 2020, retailPriceKrw: 230000 },
  { category: "MONITOR", brand: "HP", modelCode: "HP-P24H-G4", modelDisplayName: "HP P24h G4 24인치", specSummary: "24인치, FHD 1920×1080, IPS, 60Hz", releaseYear: 2021, retailPriceKrw: 310000 },
  { category: "MONITOR", brand: "Dell", modelCode: "DELL-U2722D", modelDisplayName: "Dell U2722D QHD USB-C", specSummary: "27인치, QHD 2560×1440, IPS, USB-C PD 90W", releaseYear: 2021, retailPriceKrw: 580000 },
  { category: "MONITOR", brand: "LG", modelCode: "LG-24MK430H", modelDisplayName: "LG 24MK430H 24인치", specSummary: "24인치, FHD 1920×1080, IPS, 75Hz", releaseYear: 2019, retailPriceKrw: 220000 },
  { category: "MONITOR", brand: "Samsung", modelCode: "SAM-S27A600", modelDisplayName: "삼성 S27A600 QHD", specSummary: "27인치, QHD 2560×1440, IPS, 75Hz", releaseYear: 2021, retailPriceKrw: 390000 },
  { category: "MONITOR", brand: "HP", modelCode: "HP-Z27K-G3", modelDisplayName: "HP Z27k G3 4K", specSummary: "27인치, UHD 3840×2160, IPS, USB-C", releaseYear: 2021, retailPriceKrw: 780000 },

  // 네트워크 5종
  { category: "NETWORK", brand: "Cisco", modelCode: "CISCO-C9300-24P", modelDisplayName: "Cisco Catalyst 9300 24포트 PoE+", specSummary: "24포트 GbE PoE+, 4×10G SFP+", releaseYear: 2020, retailPriceKrw: 4500000 },
  { category: "NETWORK", brand: "Cisco", modelCode: "CISCO-ISR4321", modelDisplayName: "Cisco ISR 4321 라우터", specSummary: "2×GbE WAN, 1GbE LAN, 50Mbps~100Mbps", releaseYear: 2019, retailPriceKrw: 2800000 },
  { category: "NETWORK", brand: "HP", modelCode: "HPE-2930F-24G", modelDisplayName: "HPE Aruba 2930F 24G", specSummary: "24포트 GbE, 4×SFP+", releaseYear: 2018, retailPriceKrw: 2200000 },
  { category: "NETWORK", brand: "Juniper", modelCode: "JNP-EX3400-48T", modelDisplayName: "Juniper EX3400-48T", specSummary: "48포트 GbE, 4×10G SFP+", releaseYear: 2019, retailPriceKrw: 3800000 },
  { category: "NETWORK", brand: "Cisco", modelCode: "CISCO-C9200-48T", modelDisplayName: "Cisco Catalyst 9200 48포트", specSummary: "48포트 GbE, 4×1G SFP", releaseYear: 2020, retailPriceKrw: 3200000 },

  // 스토리지 5종
  { category: "STORAGE", brand: "Dell", modelCode: "DELL-ME5024-96T", modelDisplayName: "Dell PowerVault ME5024 (96TB)", specSummary: "24베이 SAS 3.5인치, 96TB, 10GbE iSCSI", releaseYear: 2021, retailPriceKrw: 28000000 },
  { category: "STORAGE", brand: "HP", modelCode: "HPE-MSA2060-40T", modelDisplayName: "HPE MSA 2060 SAS (40TB)", specSummary: "24베이 SAS, 40TB, 12Gbps SAS", releaseYear: 2020, retailPriceKrw: 18000000 },
  { category: "STORAGE", brand: "Synology", modelCode: "SYN-RS3621XS", modelDisplayName: "Synology RackStation RS3621xs+", specSummary: "12베이 NAS, Xeon D-1531, 8GB ECC", releaseYear: 2021, retailPriceKrw: 4200000 },
  { category: "STORAGE", brand: "NetApp", modelCode: "NTAP-FAS2750", modelDisplayName: "NetApp FAS2750 (All Flash)", specSummary: "24×800GB SSD, 10GbE, ONTAP", releaseYear: 2019, retailPriceKrw: 32000000 },
  { category: "STORAGE", brand: "Dell", modelCode: "DELL-ME4024-30T", modelDisplayName: "Dell PowerVault ME4024 (30TB)", specSummary: "24베이 SAS, 30TB, 16Gbps FC", releaseYear: 2020, retailPriceKrw: 16000000 },

  // GPU 5종
  { category: "GPU", brand: "NVIDIA", modelCode: "NV-RTX4090", modelDisplayName: "NVIDIA GeForce RTX 4090 24GB", specSummary: "24GB GDDR6X, CUDA 16384, 450W TDP", releaseYear: 2022, retailPriceKrw: 2190000 },
  { category: "GPU", brand: "NVIDIA", modelCode: "NV-RTXA6000", modelDisplayName: "NVIDIA RTX A6000 48GB", specSummary: "48GB GDDR6, CUDA 10752, PCIe 4.0", releaseYear: 2021, retailPriceKrw: 7500000 },
  { category: "GPU", brand: "NVIDIA", modelCode: "NV-RTX3090", modelDisplayName: "NVIDIA GeForce RTX 3090 24GB", specSummary: "24GB GDDR6X, CUDA 10496, 350W TDP", releaseYear: 2020, retailPriceKrw: 1890000 },
  { category: "GPU", brand: "NVIDIA", modelCode: "NV-RTXA4000", modelDisplayName: "NVIDIA RTX A4000 16GB", specSummary: "16GB GDDR6, CUDA 6144, PCIe 4.0", releaseYear: 2021, retailPriceKrw: 2500000 },
  { category: "GPU", brand: "NVIDIA", modelCode: "NV-A100-40G", modelDisplayName: "NVIDIA A100 40GB PCIe", specSummary: "40GB HBM2e, 6912 CUDA, 300W TDP", releaseYear: 2020, retailPriceKrw: 12000000 },
] as const;

// 가격 베이스라인 (모델코드 → 대당 매각가 기준)
const PRICE_BASE: Record<string, number> = {
  "LG-14Z90P": 620000, "LG-16Z90P": 780000, "LG-14Z90Q": 700000, "LG-16Z90Q": 850000, "LG-14Z90R": 760000,
  "SAM-NT950XEE": 890000, "SAM-NT960XGK": 820000, "SAM-NT760XDA": 450000,
  "HP-840G9": 720000, "HP-840G10": 820000, "HP-850G9": 920000,
  "DELL-LAT5540": 650000, "DELL-LAT5430": 580000, "DELL-LAT7540": 1050000,
  "LEN-X1C-G10": 1100000, "LEN-X1C-G11": 1250000, "LEN-T14S-G3": 780000,
  "ASUS-E410MA": 380000, "APPLE-MBA-M1": 750000, "APPLE-MBA-M2": 900000,
  "MS-SP8-I5": 650000, "LG-15Z95P": 810000, "HP-PROBOOK450G9": 480000,
  "LEN-E15-G4": 550000, "HP-ZB14-G9": 1350000, "DELL-LAT5340": 580000,
  "SAM-NT550XED": 520000, "LEN-YOGA7-G7": 560000, "HP-ENVY-X360-15": 500000, "LG-17Z90P": 890000,
  "HP-PD400G9-MT": 380000, "HP-PD600G9-MT": 550000, "HP-ED800G9-SFF": 720000,
  "DELL-OP3090-MT": 320000, "DELL-OP7010-MT": 590000, "DELL-OP3000-MT": 370000,
  "LEN-M70Q-G3": 360000, "LEN-M80S-G3": 560000, "LEN-M90T-G3": 780000,
  "SAM-DB400S7A": 340000, "HP-PD400G8-SFF": 330000, "DELL-OP5090-SFF": 350000,
  "HP-PD400G7-MT": 280000, "LEN-M720T-G2": 240000, "DELL-OP3080-SFF": 270000,
  "HP-PD600G8-SFF": 490000, "DELL-OP7090-MT": 510000, "LEN-M70Q-G2": 300000,
  "HP-Z2G9-SFF": 1500000, "DELL-PREC3660-MT": 1650000, "APPLE-MAC-MINI-M1": 420000,
  "HP-ED800G8-SFF": 650000, "LEN-M90Q-G2": 520000, "SAM-DM500S8A": 350000, "DELL-OP5080-MT": 380000,
  "DELL-R750-16S": 5500000, "DELL-R650-8S": 3800000, "DELL-R640-12S": 4200000,
  "DELL-R440-8S": 2200000, "DELL-R840-32S": 16000000,
  "HPE-DL380G10-16S": 6000000, "HPE-DL360G10-8S": 3200000, "HPE-DL380G9-16S": 2800000,
  "LEN-SR650-16S": 5800000, "LEN-SR630-8S": 2800000,
  "DELL-R550-16S": 5200000, "HPE-ML350G10-12S": 3800000, "DELL-R740-24S": 9500000,
  "HPE-DL180G10-16S": 2900000, "LEN-ST650-16S": 6200000, "DELL-R750XS-12S": 4300000,
  "HPE-DL560G10-48S": 20000000, "DELL-R430-8S": 1200000, "LEN-SR590-16S": 3500000, "HPE-DL20G10-4S": 1100000,
  "DELL-P2422H": 120000, "DELL-P2422H-23": 130000, "LG-27UK850": 220000, "LG-27BN650": 160000,
  "SAM-S24F350": 80000, "HP-P24H-G4": 110000, "DELL-U2722D": 220000,
  "LG-24MK430H": 75000, "SAM-S27A600": 150000, "HP-Z27K-G3": 320000,
  "CISCO-C9300-24P": 1800000, "CISCO-ISR4321": 950000, "HPE-2930F-24G": 750000,
  "JNP-EX3400-48T": 1400000, "CISCO-C9200-48T": 1200000,
  "DELL-ME5024-96T": 12000000, "HPE-MSA2060-40T": 7500000, "SYN-RS3621XS": 1800000,
  "NTAP-FAS2750": 14000000, "DELL-ME4024-30T": 7000000,
  "NV-RTX4090": 1400000, "NV-RTXA6000": 4500000, "NV-RTX3090": 1100000,
  "NV-RTXA4000": 1500000, "NV-A100-40G": 7000000,
};

function jitter(base: number, pct = 0.15): number {
  const delta = base * pct;
  return Math.round(base + (Math.random() * delta * 2 - delta));
}

function randomDate(monthsAgo: number): Date {
  const d = subDays(subMonths(new Date(), monthsAgo), Math.floor(Math.random() * 30));
  return d;
}

async function main() {
  console.log("🌱 시드 데이터 입력 시작...");

  // 기존 데이터 정리 (순서 중요)
  await prisma.approvalLog.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.assetLine.deleteMany();
  await prisma.bidRequest.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.salesHistory.deleteMany();
  await prisma.bidHistory.deleteMany();
  await prisma.assetMaster.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  console.log("  ✓ 기존 데이터 삭제");

  // 사용자 생성
  const users = await Promise.all([
    prisma.user.create({ data: { email: "default@coretail.kr", name: "기본 사용자", role: "SALES_REP" } }),
    prisma.user.create({ data: { email: "kyg@coretail.kr", name: "계영근", role: "SALES_REP" } }),
    prisma.user.create({ data: { email: "lth@coretail.kr", name: "이태형", role: "SALES_REP" } }),
    prisma.user.create({ data: { email: "jsc@coretail.kr", name: "장수철", role: "TEAM_LEADER" } }),
    prisma.user.create({ data: { email: "director@coretail.kr", name: "본부장", role: "DIRECTOR" } }),
    prisma.user.create({ data: { email: "admin@coretail.kr", name: "관리자", role: "ADMIN" } }),
  ]);
  console.log(`  ✓ 사용자 ${users.length}명 생성`);

  // 고객사 생성
  const customers = await Promise.all(
    CUSTOMERS.map((c) =>
      prisma.customer.create({
        data: {
          name: c.name,
          sector: c.sector as "FINANCIAL" | "PUBLIC" | "CORPORATE",
          region: (c.region === "SEJONG" || c.region === "INCHEON") ? "SEOUL" : c.region as "SEOUL" | "YEONGNAM",
          winRate: c.winRate,
          totalDeals: c.totalDeals,
        },
      })
    )
  );
  console.log(`  ✓ 고객사 ${customers.length}곳 생성`);

  // 자산 마스터 생성
  const assetMasters = await Promise.all(
    ASSET_MASTERS.map((a) =>
      prisma.assetMaster.create({
        data: {
          category: a.category as any,
          brand: a.brand,
          modelCode: a.modelCode,
          modelDisplayName: a.modelDisplayName,
          specSummary: a.specSummary,
          releaseYear: a.releaseYear,
          retailPriceKrw: a.retailPriceKrw,
        },
      })
    )
  );
  console.log(`  ✓ 자산 마스터 ${assetMasters.length}종 생성`);

  // 매각 이력 생성 (각 자산당 5~15건, 최근 24개월)
  const REGIONS: Array<"SEOUL" | "CHUNGCHEONG" | "YEONGNAM" | "HONAM" | "GANGWON_JEJU"> = ["SEOUL", "SEOUL", "SEOUL", "CHUNGCHEONG", "YEONGNAM", "HONAM"];
  const GRADES: Array<"A" | "B" | "C"> = ["A", "B", "B", "C"];
  let historyCount = 0;

  for (const master of assetMasters) {
    const basePrice = PRICE_BASE[master.modelCode] ?? 500000;
    const count = 5 + Math.floor(Math.random() * 10);

    for (let i = 0; i < count; i++) {
      const monthsAgo = Math.floor(Math.random() * 24);
      const grade = GRADES[Math.floor(Math.random() * GRADES.length)];
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const yearDiff = new Date().getFullYear() - (master.releaseYear ?? 2021);
      const gradeMultiplier = grade === "A" ? 1.0 : grade === "B" ? 0.75 : 0.45;
      const price = jitter(Math.round(basePrice * gradeMultiplier));

      await prisma.salesHistory.create({
        data: {
          assetMasterId: master.id,
          customerId: Math.random() > 0.3 ? customer.id : null,
          unitPrice: price,
          quantity: 1 + Math.floor(Math.random() * 20),
          grade,
          yearDiff,
          region,
          soldAt: randomDate(monthsAgo),
          source: "internal",
        },
      });
      historyCount++;
    }
  }
  console.log(`  ✓ 매각 이력 ${historyCount}건 생성`);

  // 시세 데이터 생성 (주요 자산 30일치)
  let marketCount = 0;
  const mainAssets = assetMasters.filter((_, i) => i < 30); // 상위 30개 자산만
  for (const master of mainAssets) {
    const basePrice = PRICE_BASE[master.modelCode] ?? 500000;
    const trend = Math.random() > 0.5 ? 1 : -1;
    for (let day = 30; day >= 0; day--) {
      const drift = 1 + (trend * day * 0.001);
      await prisma.marketPrice.create({
        data: {
          assetMasterId: master.id,
          source: "DANAWA",
          price: Math.round(basePrice * drift * (0.85 + Math.random() * 0.1)),
          currency: "KRW",
          trend: trend > 0 ? "UP" : "DOWN",
          snapshotAt: subDays(new Date(), day),
        },
      });
      marketCount++;
    }
  }
  console.log(`  ✓ 시세 데이터 ${marketCount}건 생성`);

  console.log("\n🎉 시드 완료!");
  console.log(`   사용자: ${users.length}명 | 고객사: ${customers.length}곳 | 자산: ${assetMasters.length}종 | 이력: ${historyCount}건`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
