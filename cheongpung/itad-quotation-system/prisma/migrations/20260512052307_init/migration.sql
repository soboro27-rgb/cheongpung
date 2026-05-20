-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('LAPTOP', 'DESKTOP', 'SERVER', 'MONITOR', 'NETWORK', 'STORAGE', 'GPU', 'OTHER');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A', 'B', 'C', 'DEFECTIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BidType" AS ENUM ('PUBLIC', 'DESIGNATED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('SEOUL', 'CHUNGCHEONG', 'YEONGNAM', 'HONAM', 'GANGWON_JEJU');

-- CreateEnum
CREATE TYPE "DataErasure" AS ENUM ('PHYSICAL', 'SOFTWARE', 'NONE');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('FINANCIAL', 'PUBLIC', 'EDUCATION', 'HEALTHCARE', 'CORPORATE', 'OTHER');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'EXACT', 'SIMILAR', 'CATEGORY_AVG', 'UNMATCHED');

-- CreateEnum
CREATE TYPE "MarketSource" AS ENUM ('DANAWA', 'AUCTION', 'GMARKET', 'EBAY', 'MANUAL');

-- CreateEnum
CREATE TYPE "MarketTrend" AS ENUM ('UP', 'STABLE', 'DOWN');

-- CreateEnum
CREATE TYPE "BidRequestStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'CALCULATED', 'SUBMITTED', 'WON', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SALES_REP', 'TEAM_LEADER', 'DIRECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'COMMENTED', 'REVOKED');

-- CreateTable
CREATE TABLE "customers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "sector" "Sector" NOT NULL,
    "region" "Region" NOT NULL,
    "tax_id" VARCHAR(20),
    "contact_name" VARCHAR(100),
    "contact_email" VARCHAR(200),
    "contact_phone" VARCHAR(50),
    "win_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deals" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_masters" (
    "id" BIGSERIAL NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model_code" VARCHAR(100) NOT NULL,
    "model_display_name" VARCHAR(200) NOT NULL,
    "spec_summary" VARCHAR(500),
    "spec_json" JSONB,
    "release_year" INTEGER,
    "retail_price_krw" DECIMAL(15,0),
    "depreciation_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "lifecycle_months" INTEGER NOT NULL DEFAULT 60,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SALES_REP',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_requests" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "sales_rep_id" BIGINT NOT NULL,
    "bid_type" "BidType" NOT NULL,
    "pickup_date" DATE NOT NULL,
    "pickup_region" "Region" NOT NULL,
    "data_erasure" "DataErasure" NOT NULL,
    "lead_time_days" INTEGER NOT NULL DEFAULT 14,
    "notes" TEXT,
    "status" "BidRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bid_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_lines" (
    "id" BIGSERIAL NOT NULL,
    "bid_request_id" BIGINT NOT NULL,
    "asset_master_id" BIGINT,
    "raw_model_name" VARCHAR(300) NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "manufacture_year" INTEGER,
    "grade" "Grade" NOT NULL DEFAULT 'UNKNOWN',
    "quantity" INTEGER NOT NULL,
    "match_status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "match_score" DOUBLE PRECISION,
    "match_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_histories" (
    "id" BIGSERIAL NOT NULL,
    "asset_master_id" BIGINT NOT NULL,
    "customer_id" BIGINT,
    "unit_price" DECIMAL(15,0) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "grade" "Grade" NOT NULL,
    "year_diff" INTEGER NOT NULL,
    "region" "Region" NOT NULL,
    "sold_at" DATE NOT NULL,
    "source" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_histories" (
    "id" BIGSERIAL NOT NULL,
    "asset_master_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "bid_price" DECIMAL(15,0) NOT NULL,
    "won_price" DECIMAL(15,0),
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "bidder_count" INTEGER,
    "bid_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_prices" (
    "id" BIGSERIAL NOT NULL,
    "asset_master_id" BIGINT NOT NULL,
    "source" "MarketSource" NOT NULL,
    "price" DECIMAL(15,0) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'KRW',
    "trend" "MarketTrend" NOT NULL DEFAULT 'STABLE',
    "snapshot_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" BIGSERIAL NOT NULL,
    "quotation_number" VARCHAR(50) NOT NULL,
    "bid_request_id" BIGINT NOT NULL,
    "base_amount" DECIMAL(15,0) NOT NULL,
    "market_adjustment" DECIMAL(15,0) NOT NULL,
    "cost_total" DECIMAL(15,0) NOT NULL,
    "cost_logistics" DECIMAL(15,0) NOT NULL,
    "cost_erasure" DECIMAL(15,0) NOT NULL,
    "cost_inspection" DECIMAL(15,0) NOT NULL,
    "margin_rate" DOUBLE PRECISION NOT NULL,
    "margin_amount" DECIMAL(15,0) NOT NULL,
    "risk_buffer_rate" DOUBLE PRECISION NOT NULL,
    "risk_buffer_amount" DECIMAL(15,0) NOT NULL,
    "final_amount" DECIMAL(15,0) NOT NULL,
    "confidence_score" INTEGER NOT NULL,
    "valid_until" DATE NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'CALCULATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_lines" (
    "id" BIGSERIAL NOT NULL,
    "quotation_id" BIGINT NOT NULL,
    "asset_line_id" BIGINT NOT NULL,
    "base_price" DECIMAL(15,0) NOT NULL,
    "c1_grade" DOUBLE PRECISION NOT NULL,
    "c2_age" DOUBLE PRECISION NOT NULL,
    "c3_market" DOUBLE PRECISION NOT NULL,
    "c4_region" DOUBLE PRECISION NOT NULL,
    "c5_customer" DOUBLE PRECISION NOT NULL,
    "final_unit_price" DECIMAL(15,0) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(15,0) NOT NULL,
    "history_count" INTEGER NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_logs" (
    "id" BIGSERIAL NOT NULL,
    "quotation_id" BIGINT NOT NULL,
    "approver_id" BIGINT NOT NULL,
    "approver_role" "UserRole" NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "comment" TEXT,
    "acted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_tax_id_key" ON "customers"("tax_id");

-- CreateIndex
CREATE INDEX "customers_sector_idx" ON "customers"("sector");

-- CreateIndex
CREATE INDEX "customers_region_idx" ON "customers"("region");

-- CreateIndex
CREATE UNIQUE INDEX "asset_masters_model_code_key" ON "asset_masters"("model_code");

-- CreateIndex
CREATE INDEX "asset_masters_category_idx" ON "asset_masters"("category");

-- CreateIndex
CREATE INDEX "asset_masters_brand_idx" ON "asset_masters"("brand");

-- CreateIndex
CREATE INDEX "asset_masters_model_code_idx" ON "asset_masters"("model_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "bid_requests_customer_id_idx" ON "bid_requests"("customer_id");

-- CreateIndex
CREATE INDEX "bid_requests_sales_rep_id_idx" ON "bid_requests"("sales_rep_id");

-- CreateIndex
CREATE INDEX "bid_requests_status_idx" ON "bid_requests"("status");

-- CreateIndex
CREATE INDEX "asset_lines_bid_request_id_idx" ON "asset_lines"("bid_request_id");

-- CreateIndex
CREATE INDEX "asset_lines_asset_master_id_idx" ON "asset_lines"("asset_master_id");

-- CreateIndex
CREATE INDEX "asset_lines_match_status_idx" ON "asset_lines"("match_status");

-- CreateIndex
CREATE INDEX "sales_histories_asset_master_id_sold_at_idx" ON "sales_histories"("asset_master_id", "sold_at");

-- CreateIndex
CREATE INDEX "sales_histories_customer_id_idx" ON "sales_histories"("customer_id");

-- CreateIndex
CREATE INDEX "bid_histories_asset_master_id_bid_date_idx" ON "bid_histories"("asset_master_id", "bid_date");

-- CreateIndex
CREATE INDEX "bid_histories_customer_id_idx" ON "bid_histories"("customer_id");

-- CreateIndex
CREATE INDEX "market_prices_asset_master_id_snapshot_at_idx" ON "market_prices"("asset_master_id", "snapshot_at");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");

-- CreateIndex
CREATE INDEX "quotations_bid_request_id_idx" ON "quotations"("bid_request_id");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotation_lines_quotation_id_idx" ON "quotation_lines"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_lines_asset_line_id_idx" ON "quotation_lines"("asset_line_id");

-- CreateIndex
CREATE INDEX "approval_logs_quotation_id_idx" ON "approval_logs"("quotation_id");

-- AddForeignKey
ALTER TABLE "bid_requests" ADD CONSTRAINT "bid_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_requests" ADD CONSTRAINT "bid_requests_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_lines" ADD CONSTRAINT "asset_lines_bid_request_id_fkey" FOREIGN KEY ("bid_request_id") REFERENCES "bid_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_lines" ADD CONSTRAINT "asset_lines_asset_master_id_fkey" FOREIGN KEY ("asset_master_id") REFERENCES "asset_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_histories" ADD CONSTRAINT "sales_histories_asset_master_id_fkey" FOREIGN KEY ("asset_master_id") REFERENCES "asset_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_histories" ADD CONSTRAINT "sales_histories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_histories" ADD CONSTRAINT "bid_histories_asset_master_id_fkey" FOREIGN KEY ("asset_master_id") REFERENCES "asset_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_histories" ADD CONSTRAINT "bid_histories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_asset_master_id_fkey" FOREIGN KEY ("asset_master_id") REFERENCES "asset_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_bid_request_id_fkey" FOREIGN KEY ("bid_request_id") REFERENCES "bid_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_asset_line_id_fkey" FOREIGN KEY ("asset_line_id") REFERENCES "asset_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
