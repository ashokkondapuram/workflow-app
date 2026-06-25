export interface Appointment {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  date: string;
  time: string;
  duration_minutes: number;
  notes?: string;
  reminder_sent: boolean;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

export interface ReminderConfig {
  webhook_url: string;
  reminder_hours_before: number;
  email_enabled: boolean;
  sms_enabled: boolean;
}
