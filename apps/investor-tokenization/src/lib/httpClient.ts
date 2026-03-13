import { createHttpClient } from "@tokenization/shared/lib/httpClient";

export const httpClient = createHttpClient({
  baseURL: "/core-api",
  apiKey: process.env.NEXT_PUBLIC_INVESTORS_API_KEY ?? "",
});
