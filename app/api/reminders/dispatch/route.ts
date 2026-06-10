import { NextResponse } from "next/server";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { getServiceSupabase } from "@/lib/auth-server";
import { hasEmailTransport, sendFallbackEmail } from "@/lib/email";
import {
  buildBursaryReminderMessage,
  buildStudyReminderMessage,
  normalizeWhatsappPhone,
  reminderKeyForBursary,
  reminderKeyForStudy
} from "@/lib/whatsapp-reminders";
import { hasWhatsappTransport, sendWhatsappMessage } from "@/lib/whatsapp";
import type { LearnerProfile, StudyTask } from "@/lib/types";

type LearnerProfileRow = {
  id: string;
  grade: 10 | 11 | 12;
  province: string;
  school_name: string | null;
  home_language: string;
  internet_access_level: "low" | "medium" | "high";
  career_interests: string[] | null;
  preferred_study_times: string[] | null;
  exam_date: string | null;
  whatsapp_phone: string | null;
  whatsapp_opt_in: boolean | null;
  whatsapp_study_reminders: boolean | null;
  whatsapp_deadline_reminders: boolean | null;
  reminder_email: string | null;
  fallback_email_enabled: boolean | null;
  reminder_timezone: string | null;
  reminder_paused_until: string | null;
  study_reminder_hour: number | null;
  deadline_reminder_hour: number | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  whatsapp_last_study_reminder_at: string | null;
  whatsapp_last_deadline_reminder_at: string | null;
  learner_subjects?: Array<{
    id: string;
    current_mark: number | string;
    target_mark: number | string;
    subjects: {
      id: string;
      name: string;
      grade: 10 | 11 | 12;
    } | null | Array<{
      id: string;
      name: string;
      grade: 10 | 11 | 12;
    }>;
  }>;
};

type StudyPlanRow = {
  id: string;
  study_tasks: Array<{
    id: string;
    topic: string;
    task_type: string;
    due_date: string | null;
    completed: boolean;
    subjects: { id: string; name: string; grade: 10 | 11 | 12 } | null | Array<{ id: string; name: string; grade: 10 | 11 | 12 }>;
  }>;
};

const defaultTimezone = "Africa/Johannesburg";

export async function GET(request: Request) {
  const { allowed } = authorizeDispatch(request);
  if (!allowed) {
    return NextResponse.json({ error: "Dispatch not authorised." }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const whatsappEnabled = hasWhatsappTransport();
  const emailEnabled = hasEmailTransport();
  const summary = {
    whatsappEnabled,
    emailEnabled,
    learnersChecked: 0,
    studyMessagesSent: 0,
    bursaryMessagesSent: 0,
    studyMessagesFailed: 0,
    bursaryMessagesFailed: 0,
    skippedNoChannel: 0,
    skippedPaused: 0,
    skippedQuietHours: 0,
    skippedNotScheduled: 0
  };

  const { data: learners, error: learnerError } = await supabase
    .from("learner_profiles")
    .select(`
      id,
      grade,
      province,
      school_name,
      home_language,
      internet_access_level,
      career_interests,
      preferred_study_times,
      exam_date,
      whatsapp_phone,
      whatsapp_opt_in,
      whatsapp_study_reminders,
      whatsapp_deadline_reminders,
      reminder_email,
      fallback_email_enabled,
      reminder_timezone,
      reminder_paused_until,
      study_reminder_hour,
      deadline_reminder_hour,
      quiet_hours_start,
      quiet_hours_end,
      whatsapp_last_study_reminder_at,
      whatsapp_last_deadline_reminder_at,
      learner_subjects (
        id,
        current_mark,
        target_mark,
        subjects (
          id,
          name,
          grade
        )
      )
    `)
    .eq("whatsapp_opt_in", true);

  if (learnerError) {
    return NextResponse.json({ error: learnerError.message }, { status: 400 });
  }

  for (const row of (learners ?? []) as LearnerProfileRow[]) {
    summary.learnersChecked += 1;

    const learnerProfile = mapLearnerProfile(row);
    const timeZone = learnerProfile.reminderTimezone || defaultTimezone;
    const now = new Date();
    const today = formatDateInTimezone(now, timeZone);
    const hour = currentHourInTimezone(now, timeZone);

    if (isReminderPaused(row.reminder_paused_until, today)) {
      summary.skippedPaused += 1;
      continue;
    }

    const whatsappTo = normalizeWhatsappPhone(row.whatsapp_phone ?? "");
    const emailTo = (row.reminder_email ?? "").trim();
    const canWhatsapp = Boolean(whatsappTo && row.whatsapp_opt_in && whatsappEnabled);
    const canEmail = Boolean(emailTo && row.fallback_email_enabled && emailEnabled);

    if (!canWhatsapp && !canEmail) {
      summary.skippedNoChannel += 1;
      continue;
    }

    if (row.whatsapp_study_reminders && row.study_reminder_hour === hour && !isWithinQuietHours(row.quiet_hours_start, row.quiet_hours_end, hour)) {
      const reminderKey = reminderKeyForStudy(today);
      if (!(await hasSentReminder(supabase, learnerProfile.id, "study", reminderKey))) {
        const studyTasks = await loadStudyTasksForLearner(supabase, learnerProfile.id, learnerProfile, timeZone);
        const message = buildStudyReminderMessage(learnerProfile, studyTasks, now);
        try {
          await deliverReminder({
            supabase,
            learnerId: learnerProfile.id,
            reminderType: "study",
            reminderKey,
            whatsappTo: canWhatsapp ? whatsappTo : null,
            emailTo: canEmail ? emailTo : null,
            subject: "MatricSA study reminder",
            body: message,
            payload: { kind: "study", date: today, taskCount: studyTasks.length }
          });
          summary.studyMessagesSent += 1;
        } catch {
          summary.studyMessagesFailed += 1;
        }
      } else {
        summary.skippedNotScheduled += 1;
      }
    }

    if (row.whatsapp_deadline_reminders && row.deadline_reminder_hour === hour && !isWithinQuietHours(row.quiet_hours_start, row.quiet_hours_end, hour)) {
      const bursaryRows = await loadDueBursaryRemindersForLearner(supabase, learnerProfile.id, today);
      for (const bursaryReminder of bursaryRows) {
        const bursary = bursaryReminder.bursary;
        const reminderDays = bursaryReminder.daysBeforeDeadline;
        if (!bursary?.deadline || !reminderDays) continue;

        const reminderKey = reminderKeyForBursary(bursary.id, bursary.deadline, reminderDays);
        if (await hasSentReminder(supabase, learnerProfile.id, "deadline", reminderKey)) {
          summary.skippedNotScheduled += 1;
          continue;
        }

        try {
          await deliverReminder({
            supabase,
            learnerId: learnerProfile.id,
            reminderType: "deadline",
            reminderKey,
            whatsappTo: canWhatsapp ? whatsappTo : null,
            emailTo: canEmail ? emailTo : null,
            subject: `${bursary.name} deadline reminder`,
            body: buildBursaryReminderMessage(
              {
                name: bursary.name,
                provider: bursary.provider,
                applicationUrl: bursary.application_url,
                notes: bursary.notes ?? ""
              },
              reminderDays,
              bursary.deadline
            ),
            payload: {
              kind: "deadline",
              bursaryId: bursary.id,
              deadline: bursary.deadline,
              daysBeforeDeadline: reminderDays
            }
          });
          await supabase
            .from("bursary_reminders")
            .update({ last_sent_at: new Date().toISOString() })
            .eq("learner_id", learnerProfile.id)
            .eq("bursary_id", bursary.id);
          await supabase.from("learner_profiles").update({ whatsapp_last_deadline_reminder_at: today }).eq("id", learnerProfile.id);
          summary.bursaryMessagesSent += 1;
        } catch {
          summary.bursaryMessagesFailed += 1;
        }
      }
    } else {
      summary.skippedQuietHours += 1;
    }
  }

  return NextResponse.json({ data: summary });
}

function authorizeDispatch(request: Request) {
  if (process.env.NODE_ENV !== "production") return { allowed: true as const };

  const secret = process.env.WHATSAPP_DISPATCH_SECRET;
  const headerSecret = request.headers.get("x-whatsapp-dispatch-secret") ?? "";
  const cronHeader = request.headers.get("x-vercel-cron");

  if (cronHeader === "1") return { allowed: true as const };
  if (secret && headerSecret === secret) return { allowed: true as const };
  return { allowed: false as const };
}

async function deliverReminder(input: {
  supabase: ReturnType<typeof getServiceSupabase>;
  learnerId: string;
  reminderType: string;
  reminderKey: string;
  whatsappTo: string | null;
  emailTo: string | null;
  subject: string;
  body: string;
  payload: Record<string, unknown>;
}) {
  const existing = await getReminderDelivery(input.supabase, input.learnerId, input.reminderType, input.reminderKey);
  const attempts = (existing?.attempt_count ?? 0) + 1;
  if (attempts > 3) {
    throw new Error("Retry limit reached.");
  }

  if (input.whatsappTo) {
    try {
      await sendWhatsappMessage({ to: input.whatsappTo, body: input.body });
      await saveReminderDelivery(input.supabase, {
        learnerId: input.learnerId,
        channel: "whatsapp",
        provider: "twilio",
        recipient: input.whatsappTo,
        reminderType: input.reminderType,
        reminderKey: input.reminderKey,
        payload: input.payload,
        status: "sent",
        attemptCount: attempts
      });
      return;
    } catch (error) {
      await saveReminderDelivery(input.supabase, {
        learnerId: input.learnerId,
        channel: "whatsapp",
        provider: "twilio",
        recipient: input.whatsappTo,
        reminderType: input.reminderType,
        reminderKey: input.reminderKey,
        payload: { ...input.payload, channel: "whatsapp" },
        status: "failed",
        attemptCount: attempts,
        errorMessage: error instanceof Error ? error.message : String(error || "Delivery failed")
      });
      if (!input.emailTo) {
        throw error;
      }
    }
  }

  if (input.emailTo) {
    try {
      await sendFallbackEmail({ to: input.emailTo, subject: input.subject, text: input.body });
      await saveReminderDelivery(input.supabase, {
        learnerId: input.learnerId,
        channel: "email",
        provider: "resend",
        recipient: input.emailTo,
        reminderType: input.reminderType,
        reminderKey: input.reminderKey,
        payload: { ...input.payload, channel: "email" },
        status: "sent",
        attemptCount: attempts
      });
      return;
    } catch (error) {
      await saveReminderDelivery(input.supabase, {
        learnerId: input.learnerId,
        channel: "email",
        provider: "resend",
        recipient: input.emailTo,
        reminderType: input.reminderType,
        reminderKey: input.reminderKey,
        payload: { ...input.payload, channel: "email" },
        status: "failed",
        attemptCount: attempts,
        errorMessage: error instanceof Error ? error.message : String(error || "Email delivery failed")
      });
      throw error;
    }
  }

  throw new Error("No delivery channel configured.");
}

function mapLearnerProfile(row: LearnerProfileRow): LearnerProfile {
  const subjects = (row.learner_subjects ?? [])
    .map((item) => {
      const subject = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects;
      return {
        id: item.id,
        subjectId: subject?.id,
        name: subject?.name ?? "Unknown subject",
        grade: subject?.grade ?? row.grade,
        currentMark: Number(item.current_mark),
        targetMark: Number(item.target_mark)
      };
    })
    .filter((item) => item.name !== "Unknown subject");

  return {
    id: row.id,
    grade: row.grade,
    province: row.province,
    schoolName: row.school_name ?? undefined,
    homeLanguage: row.home_language,
    internetAccessLevel: row.internet_access_level,
    careerInterests: row.career_interests ?? [],
    preferredStudyTimes: row.preferred_study_times ?? [],
    examDate: row.exam_date ?? "",
    whatsappPhone: row.whatsapp_phone ?? "",
    whatsappOptIn: Boolean(row.whatsapp_opt_in),
    whatsappStudyReminders: Boolean(row.whatsapp_study_reminders),
    whatsappDeadlineReminders: Boolean(row.whatsapp_deadline_reminders),
    reminderEmail: row.reminder_email ?? "",
    fallbackEmailEnabled: Boolean(row.fallback_email_enabled),
    reminderTimezone: row.reminder_timezone ?? defaultTimezone,
    reminderPausedUntil: row.reminder_paused_until ?? "",
    studyReminderHour: row.study_reminder_hour ?? 18,
    deadlineReminderHour: row.deadline_reminder_hour ?? 10,
    quietHoursStart: row.quiet_hours_start ?? 20,
    quietHoursEnd: row.quiet_hours_end ?? 6,
    subjects
  };
}

async function loadStudyTasksForLearner(supabase: ReturnType<typeof getServiceSupabase>, learnerId: string, profile: LearnerProfile, timeZone: string) {
  const { data, error } = await supabase
    .from("study_plans")
    .select(`
      id,
      study_tasks (
        id,
        topic,
        task_type,
        due_date,
        completed,
        subjects (
          id,
          name,
          grade
        )
      )
    `)
    .eq("learner_id", learnerId)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = data as StudyPlanRow | null;
  if (error || !plan?.study_tasks?.length) {
    return generateLocalStudyPlan(profile);
  }

  return plan.study_tasks
    .filter((task) => !task.completed)
    .map((task, index) => {
      const subject = Array.isArray(task.subjects) ? task.subjects[0] : task.subjects;
      return {
        id: task.id,
        day: new Intl.DateTimeFormat("en-ZA", { weekday: "short", timeZone }).format(task.due_date ? new Date(task.due_date) : new Date()),
        subject: subject?.name ?? profile.subjects[index % Math.max(profile.subjects.length, 1)]?.name ?? "Study",
        topic: task.topic,
        taskType: mapTaskType(task.task_type),
        durationMinutes: profile.internetAccessLevel === "low" ? 35 : 50,
        dueDate: task.due_date ?? undefined,
        completed: task.completed
      };
    });
}

async function loadDueBursaryRemindersForLearner(supabase: ReturnType<typeof getServiceSupabase>, learnerId: string, today: string) {
  const { data, error } = await supabase
    .from("bursary_reminders")
    .select(`
      bursary_id,
      days_before_deadline,
      bursaries (
        id,
        name,
        provider,
        deadline,
        application_url,
        notes
      )
    `)
    .eq("learner_id", learnerId)
    .eq("saved", true)
    .eq("send_whatsapp", true);

  if (error || !data) return [];
  return data
    .map((row) => {
      const bursary = Array.isArray(row.bursaries) ? row.bursaries[0] : row.bursaries;
      return bursary?.deadline && row.days_before_deadline && offsetDate(bursary.deadline, -row.days_before_deadline) === today
        ? { bursary, daysBeforeDeadline: row.days_before_deadline }
        : null;
    })
    .filter((row): row is { bursary: { id: string; name: string; provider: string; deadline: string; application_url: string; notes: string | null }; daysBeforeDeadline: number } => Boolean(row));
}

async function hasSentReminder(supabase: ReturnType<typeof getServiceSupabase>, learnerId: string, reminderType: string, reminderKey: string) {
  const { data, error } = await supabase
    .from("notification_deliveries")
    .select("id,status")
    .eq("learner_id", learnerId)
    .eq("reminder_type", reminderType)
    .eq("reminder_key", reminderKey)
    .eq("status", "sent")
    .limit(1);

  if (error) return false;
  return Boolean(data?.[0]);
}

async function getReminderDelivery(supabase: ReturnType<typeof getServiceSupabase>, learnerId: string, reminderType: string, reminderKey: string) {
  const { data } = await supabase
    .from("notification_deliveries")
    .select("attempt_count,status")
    .eq("learner_id", learnerId)
    .eq("reminder_type", reminderType)
    .eq("reminder_key", reminderKey)
    .order("last_attempt_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

async function saveReminderDelivery(
  supabase: ReturnType<typeof getServiceSupabase>,
  input: {
    learnerId: string;
    channel: "whatsapp" | "email";
    provider: "twilio" | "resend";
    recipient: string;
    reminderType: string;
    reminderKey: string;
    payload: Record<string, unknown>;
    status: "sent" | "failed";
    attemptCount: number;
    errorMessage?: string;
  }
) {
  const { error } = await supabase.from("notification_deliveries").upsert(
    {
      learner_id: input.learnerId,
      channel: input.channel,
      delivery_provider: input.provider,
      recipient: input.recipient,
      reminder_type: input.reminderType,
      reminder_key: input.reminderKey,
      payload_json: input.payload,
      status: input.status,
      attempt_count: input.attemptCount,
      error_message: input.errorMessage ?? null,
      last_attempt_at: new Date().toISOString(),
      sent_at: input.status === "sent" ? new Date().toISOString() : undefined
    },
    { onConflict: "learner_id,channel,reminder_type,reminder_key" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

function offsetDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00+02:00`);
  value.setDate(value.getDate() + days);
  return formatDateInTimezone(value, defaultTimezone);
}

function formatDateInTimezone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

function currentHourInTimezone(date: Date, timeZone: string) {
  return Number.parseInt(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false }).format(date), 10);
}

function todayInSouthAfrica() {
  return formatDateInTimezone(new Date(), defaultTimezone);
}

function isReminderPaused(pausedUntil: string | null, today: string) {
  return Boolean(pausedUntil && pausedUntil >= today);
}

function isWithinQuietHours(start?: number | null, end?: number | null, hour = currentHourInTimezone(new Date(), defaultTimezone)) {
  const quietStart = typeof start === "number" ? start : 20;
  const quietEnd = typeof end === "number" ? end : 6;
  if (quietStart === quietEnd) return false;
  if (quietStart < quietEnd) return hour >= quietStart && hour < quietEnd;
  return hour >= quietStart || hour < quietEnd;
}

function mapTaskType(taskType: string): StudyTask["taskType"] {
  if (taskType === "assessment") return "assessment";
  if (taskType === "concept" || taskType === "practice" || taskType === "revision") return taskType;
  return "practice";
}
