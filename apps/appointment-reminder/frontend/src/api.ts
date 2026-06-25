import axios from "axios";
import { Appointment, ReminderConfig } from "./types";

const api = axios.create({ baseURL: "/api" });

export const getAppointments = () => api.get<Appointment[]>("/appointments/").then(r => r.data);
export const createAppointment = (data: any) => api.post<Appointment>("/appointments/", data).then(r => r.data);
export const updateAppointment = (id: string, data: any) => api.put<Appointment>(`/appointments/${id}`, data).then(r => r.data);
export const updateStatus = (id: string, status: string) => api.patch(`/appointments/${id}/status?status=${status}`).then(r => r.data);
export const deleteAppointment = (id: string) => api.delete(`/appointments/${id}`).then(r => r.data);
export const getConfig = () => api.get<ReminderConfig>("/config/").then(r => r.data);
export const saveConfig = (cfg: ReminderConfig) => api.post("/config/", cfg).then(r => r.data);
export const triggerReminders = () => api.post("/trigger-reminders").then(r => r.data);
