import { createHttpClient } from "@tokenization/shared/lib/httpClient";

export const httpClient = createHttpClient({
  baseURL: "/core-api",
  apiKey: process.env.NEXT_PUBLIC_BACKOFFICE_API_KEY ?? "",
});
