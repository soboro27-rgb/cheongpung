import https from "https";

// 앱인토스 인앱결제 주문 상태 서버 조회. mTLS 클라이언트 인증서가 필요하다
// (콘솔 웹 "mTLS 인증서" 메뉴에서 발급 → TOSS_MTLS_CERT/TOSS_MTLS_KEY에 PEM 텍스트로 설정).
// 인증서가 없으면 항상 false를 돌려줘, 미검증 상태로 크레딧이 지급되지 않게 막는다.

export interface OrderStatus {
  orderId: string;
  sku: string;
  status: "PURCHASED" | "PAYMENT_COMPLETED" | "FAILED" | "REFUNDED" | "ORDER_IN_PROGRESS" | "NOT_FOUND" | "MINIAPP_MISMATCH" | "ERROR";
  reason?: string;
}

export function isMtlsConfigured(): boolean {
  return !!(process.env.TOSS_MTLS_CERT && process.env.TOSS_MTLS_KEY);
}

export function getOrderStatus(orderId: string): Promise<OrderStatus> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ orderId });
    const req = https.request(
      {
        hostname: "apps-in-toss-api.toss.im",
        path: "/api-partner/v1/apps-in-toss/order/get-order-status",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        cert: process.env.TOSS_MTLS_CERT,
        key: process.env.TOSS_MTLS_KEY,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.resultType === "SUCCESS") resolve(parsed.success as OrderStatus);
            else reject(new Error(parsed.error?.reason ?? "주문 조회 실패"));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
