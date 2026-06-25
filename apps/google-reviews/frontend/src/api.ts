import axios from "axios";
import { Review, ReviewConfig, ReviewStats } from "./types";

const api = axios.create({ baseURL: "/api" });

export const getReviews = (params?: { rating?: number; status?: string }) =>
  api.get<Review[]>("/reviews/", { params }).then((r) => r.data);

export const getReviewStats = () =>
  api.get<ReviewStats>("/reviews/stats").then((r) => r.data);

export const syncReviews = () =>
  api.post("/reviews/sync").then((r) => r.data);

export const postReply = (id: string, reply_text: string) =>
  api.post(`/reviews/${id}/reply`, { reply_text }).then((r) => r.data);

export const triggerAutoReply = (id: string) =>
  api.post(`/reviews/${id}/auto-reply`).then((r) => r.data);

export const getConfig = () =>
  api.get<ReviewConfig>("/config/").then((r) => r.data);

export const saveConfig = (cfg: Partial<ReviewConfig>) =>
  api.post("/config/", cfg).then((r) => r.data);

export const triggerSync = () =>
  api.post("/trigger-sync").then((r) => r.data);

export const getOAuthStatus = () =>
  api.get<{ connected: boolean; redirect_uri: string }>("/oauth/status").then((r) => r.data);

export const disconnectOAuth = () =>
  api.post("/oauth/disconnect").then((r) => r.data);
