"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, History, PauseCircle, PlayCircle, Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getCurrentUser, saveReminderSettings } from "@/lib/learner-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLearnerProfile } from "@/lib/use-learner-profile";
import { friendlyError } from "@/lib/utils";

type DeliveryRow = {
  id: string;
  channel: string;
  delivery_provider: string;
  recipient: string;
  reminder_type: string;
  reminder_key: string;
  status: string;
  attempt_count: number;
  error_message: string | null;
  sent_at: string;
  last_attempt_at: string;
  payload_json: Record<string, unknown> | null;
};

type ReminderSettingsInput = {
  whatsappPhone: string;
  whatsappOptIn: boolean;
  whatsappStudyReminders: boolean;
  whatsappDeadlineReminders: boolean;
  reminderEmail: string;
  fallbackEmailEnabled: boolean;
  reminderTimezone: string;
  reminderPausedUntil: string;
  studyReminderHour: number;
  deadlineReminderHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
};

export default function NotificationsPage() {
  const { profile, isDemo, isLoading } = useLearnerProfile();
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [whatsappStudyReminders, setWhatsappStudyReminders] = useState(false);
  const [whatsappDeadlineReminders, setWhatsappDeadlineReminders] = useState(false);
  const [reminderEmail, setReminderEmail] = useState("");
  const [fallbackEmailEnabled, setFallbackEmailEnabled] = useState(false);
  const [reminderTimezone, setReminderTimezone] = useState("Africa/Johannesburg");
  const [reminderPausedUntil, setReminderPausedUntil] = useState("");
  const [studyReminderHour, setStudyReminderHour] = useState(18);
  const [deadlineReminderHour, setDeadlineReminderHour] = useState(10);
  const [quietHoursStart, setQuietHoursStart] = useState(20);
  const [quietHoursEnd, setQuietHoursEnd] = useState(6);

  useEffect(() => {
    setWhatsappPhone(profile.whatsappPhone ?? "");
    setWhatsappOptIn(Boolean(profile.whatsappOptIn));
    setWhatsappStudyReminders(Boolean(profile.whatsappStudyReminders));
    setWhatsappDeadlineReminders(Boolean(profile.whatsappDeadlineReminders));
    setReminderEmail(profile.reminderEmail ?? "");
    setFallbackEmailEnabled(Boolean(profile.fallbackEmailEnabled));
    setReminderTimezone(profile.reminderTimezone ?? "Africa/Johannesburg");
    setReminderPausedUntil(profile.reminderPausedUntil ?? "");
    setStudyReminderHour(profile.studyReminderHour ?? 18);
    setDeadlineReminderHour(profile.deadlineReminderHour ?? 10);
    setQuietHoursStart(profile.quietHoursStart ?? 20);
    setQuietHoursEnd(profile.quietHoursEnd ?? 6);
  }, [profile]);

  const loadDeliveries = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || profile.id === "demo-learner") return;

    const { data } = await supabase
      .from("notification_deliveries")
      .select("id,channel,delivery_provider,recipient,reminder_type,reminder_key,status,attempt_count,error_message,sent_at,last_attempt_at,payload_json")
      .eq("learner_id", profile.id)
      .order("sent_at", { ascending: false })
      .limit(25);

    setDeliveries((data as DeliveryRow[] | null) ?? []);
  }, [profile.id]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  async function saveSettings(overrides: Partial<ReminderSettingsInput> = {}) {
    setIsSaving(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || isDemo) {
        setMessage("Demo mode: reminder settings are local only.");
        return;
      }
      const user = await getCurrentUser(supabase);
      if (!user) throw new Error("Login required.");
      const nextSettings = {
        whatsappPhone,
        whatsappOptIn,
        whatsappStudyReminders,
        whatsappDeadlineReminders,
        reminderEmail,
        fallbackEmailEnabled,
        reminderTimezone,
        reminderPausedUntil,
        studyReminderHour,
        deadlineReminderHour,
        quietHoursStart,
        quietHoursEnd,
        ...overrides
      };
      await saveReminderSettings(supabase, user, nextSettings);
      setMessage("Reminder settings saved.");
      await loadDeliveries();
    } catch (error) {
      setMessage(friendlyError(error, "Could not save reminder settings."));
    } finally {
      setIsSaving(false);
    }
  }

  async function pauseFor(days: number) {
    const next = new Date();
    next.setDate(next.getDate() + days);
    setReminderPausedUntil(next.toISOString().slice(0, 10));
    await saveSettings({ reminderPausedUntil: next.toISOString().slice(0, 10) });
  }

  async function clearPause() {
    setReminderPausedUntil("");
    await saveSettings({ reminderPausedUntil: "" });
  }

  const counts = useMemo(() => {
    const sent = deliveries.filter((item) => item.status === "sent").length;
    const failed = deliveries.filter((item) => item.status === "failed").length;
    return { sent, failed };
  }, [deliveries]);

  return (
    <AppShell>
      <PageHeader title="Notifications" eyebrow="Reminder control">
        Manage WhatsApp reminders, email fallback, quiet hours, pause/resume controls, and delivery history.
      </PageHeader>

      {isLoading ? <Card className="mb-4">Loading reminder settings...</Card> : null}
      {message ? <Card className="mb-4">{message}</Card> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="flex items-center gap-2 text-lg font-black">
            <BellRing size={18} /> Reminder settings
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp number"><input value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value)} className="input" placeholder="+27..." /></Field>
            <Field label="WhatsApp opt-in">
              <select value={String(whatsappOptIn)} onChange={(event) => setWhatsappOptIn(event.target.value === "true")} className="input">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm font-bold text-ink/75">
              <input type="checkbox" checked={whatsappStudyReminders} onChange={(event) => setWhatsappStudyReminders(event.target.checked)} />
              Send study reminders
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-ink/75">
              <input type="checkbox" checked={whatsappDeadlineReminders} onChange={(event) => setWhatsappDeadlineReminders(event.target.checked)} />
              Send deadline reminders
            </label>
            <Field label="Fallback email"><input value={reminderEmail} onChange={(event) => setReminderEmail(event.target.value)} className="input" placeholder="name@example.com" /></Field>
            <Field label="Email fallback">
              <select value={String(fallbackEmailEnabled)} onChange={(event) => setFallbackEmailEnabled(event.target.value === "true")} className="input">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </Field>
            <Field label="Timezone"><input value={reminderTimezone} onChange={(event) => setReminderTimezone(event.target.value)} className="input" placeholder="Africa/Johannesburg" /></Field>
            <Field label="Pause until"><input value={reminderPausedUntil} onChange={(event) => setReminderPausedUntil(event.target.value)} className="input" type="date" /></Field>
            <Field label="Study reminder hour">
              <input value={studyReminderHour} onChange={(event) => setStudyReminderHour(clampHour(event.target.value))} className="input" type="number" min="0" max="23" />
            </Field>
            <Field label="Deadline reminder hour">
              <input value={deadlineReminderHour} onChange={(event) => setDeadlineReminderHour(clampHour(event.target.value))} className="input" type="number" min="0" max="23" />
            </Field>
            <Field label="Quiet hours start">
              <input value={quietHoursStart} onChange={(event) => setQuietHoursStart(clampHour(event.target.value))} className="input" type="number" min="0" max="23" />
            </Field>
            <Field label="Quiet hours end">
              <input value={quietHoursEnd} onChange={(event) => setQuietHoursEnd(clampHour(event.target.value))} className="input" type="number" min="0" max="23" />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => pauseFor(7)} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/10 px-4 py-2 text-sm font-black">
              <PauseCircle size={16} /> Pause 7 days
            </button>
            <button type="button" onClick={clearPause} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/10 px-4 py-2 text-sm font-black">
              <PlayCircle size={16} /> Resume now
            </button>
            <button type="button" disabled={isSaving} onClick={() => void saveSettings()} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-veld px-4 py-2 text-sm font-black text-white disabled:opacity-60">
              <Send size={16} /> {isSaving ? "Saving..." : "Save settings"}
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Sent" value={counts.sent.toString()} />
            <Metric label="Failed" value={counts.failed.toString()} />
            <Metric label="Delivery" value={profile.whatsappOptIn ? "Enabled" : "Off"} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-lg font-black">
            <History size={18} /> Delivery log
          </div>
          <div className="mt-4 space-y-3">
            {deliveries.length > 0 ? deliveries.map((item) => (
              <div key={item.id} className="rounded-lg bg-chalk p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.reminder_type === "study" ? "Study reminder" : "Deadline reminder"}</p>
                    <p className="text-xs font-semibold text-ink/55">{item.channel.toUpperCase()} · {item.delivery_provider}</p>
                  </div>
                  <Badge tone={item.status === "sent" ? "safe" : "risk"}>{item.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-ink/60">Recipient: {item.recipient}</p>
                <p className="mt-1 text-xs text-ink/60">Attempts: {item.attempt_count}</p>
                <p className="mt-1 text-xs text-ink/60">Sent: {formatDateTime(item.sent_at)}</p>
                {item.error_message ? <p className="mt-1 text-xs text-protea">{item.error_message}</p> : null}
              </div>
            )) : (
              <p className="text-sm leading-6 text-ink/65">No reminders have been sent yet. Once the cron runs, delivery history will appear here.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center gap-2 text-lg font-black">
          <ShieldCheck size={18} /> Reminder controls
        </div>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
          <li>WhatsApp is the primary channel when the number and transport are configured.</li>
          <li>Email is used as a fallback when it is enabled and the WhatsApp send fails.</li>
          <li>Quiet hours stop reminders from sending during the learner’s chosen night window.</li>
          <li>Pausing reminders suspends all scheduled reminder sends until the pause date passes.</li>
        </ul>
      </Card>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-ink/80">{label}{children}</label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-chalk p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function clampHour(value: string) {
  const next = Number(value);
  if (Number.isNaN(next)) return 0;
  return Math.max(0, Math.min(23, next));
}

function formatDateTime(value: string) {
  if (!value) return "Not listed";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
