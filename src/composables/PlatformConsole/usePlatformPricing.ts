import axios from "@/plugins/axios";
import { platformHeaders } from "./usePlatformAuth";

export const fetchPricing = async () =>
  (await axios.get("/public-pricing")).data.data;
export const fetchPricingHistory = async () =>
  (await axios.get("/platform/pricing/history", { headers: platformHeaders() }))
    .data.data;
export const savePricing = async (values: object) =>
  (
    await axios.patch("/platform/pricing", values, {
      headers: platformHeaders(),
    })
  ).data.data;
