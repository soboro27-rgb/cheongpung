import { SolapiAdapter, MockAlimtalkAdapter } from "./solapi";
export type { AlimtalkAdapter, AlimtalkMessage, AlimtalkResult } from "./interface";

export function createAlimtalkAdapter() {
  if (process.env.NODE_ENV !== "production" || process.env.ALIMTALK_MOCK === "true") {
    return new MockAlimtalkAdapter();
  }
  return new SolapiAdapter(
    process.env.SOLAPI_API_KEY!,
    process.env.SOLAPI_API_SECRET!,
    process.env.SOLAPI_PF_ID!,
    process.env.ALIMTALK_TEMPLATE_ID!
  );
}
