"use server";

import { GnosisApiClient } from "gnosis-client";
import { auth } from "@clerk/nextjs/server";

export async function createAuthenticatedGnosisClient() {
  const { getToken } = await auth();

  const token = await getToken();

  if (!token) {
    throw new Error("No token found");
  }

  const client = new GnosisApiClient({
    baseUrl: process.env.GNOSIS_API_URL,
    apiKey: token,
    debug: process.env.NODE_ENV === "development",
  });

  return client;
}
