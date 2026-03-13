import axios, { type AxiosInstance } from "axios";

interface HttpClientOptions {
  baseURL: string;
  apiKey: string;
}

export function createHttpClient({ baseURL, apiKey }: HttpClientOptions): AxiosInstance {
  return axios.create({
    baseURL,
    headers: {
      "x-api-key": apiKey,
    },
  });
}
