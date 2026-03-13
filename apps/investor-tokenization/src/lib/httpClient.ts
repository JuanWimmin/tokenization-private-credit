import { createHttpClient } from "@tokenization/shared/lib/httpClient";

export const httpClient = createHttpClient({
  baseURL: process.env.NEXT_PUBLIC_CORE_API_URL ?? "http://localhost:4000",
  apiKey: process.env.NEXT_PUBLIC_INVESTORS_API_KEY ?? "",
});
