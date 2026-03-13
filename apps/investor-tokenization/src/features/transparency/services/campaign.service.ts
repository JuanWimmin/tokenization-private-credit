import { httpClient } from "@/lib/httpClient";
import type { CampaignFromApi } from "../types";

export async function fetchCampaigns(): Promise<CampaignFromApi[]> {
  const { data } = await httpClient.get<CampaignFromApi[]>("/campaigns");
  return data;
}
