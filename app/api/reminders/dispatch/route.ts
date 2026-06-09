import { NextResponse } from "next/server";
import { generateLocalStudyPlan } from "@/lib/study-plan";
import { getServiceSupabase } from "@/lib/auth-server";
import { buildBursaryReminderMessage, buildStudyReminderMessage, normalizeWhatsappPhone, reminderKeyForBursary, reminderKeyForStudy } from "@/lib/whatsapp-reminders";
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
  whatsapp_last_study_reminder_at: string | null;
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

const timezone = "Africa/Johannesburg";

export async function GET(request: Request) {
  const { allowed } = authorizeDispatch(request);
  if (!allowed) {
    return NextResponse.json({ error: "Dispatch not authorised." }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const transportAvailable = hasWhatsappTransport();
  const today = todayInSouthAfrica();
  const summary = {
    transportAvailable,
    learnersChecked: 0,
    studyMessagesSent: 0,
    bursaryMessagesSent: 0,
    skippedNoPhone: 0,
    skippedNoOptIn: 0,
    skippedNoConfig: 0
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
      whatsapp_last_study_reminder_at,
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
    let sentDeadlineForLearner = false;
    const phone = normalizeWhatsappPhone(row.whatsapp_phone ?? "");
    if (!phone) {
      summary.skippedNoPhone += 1;
      continue;
    }

    const learnerProfile = mapLearnerProfile(row);
    if (!transportAvailable) {
      summary.skippedNoConfig += 1;
      continue;
    }

    if (row.whatsapp_study_reminders && row.whatsapp_last_study_reminder_at !== today) {
      const studyTasks = await loadStudyTasksForLearner(supabase, learnerProfile.id, learnerProfile);
      const message = buildStudyReminderMessage(learnerProfile, studyTasks);
      const reminderKey = reminderKeyForStudy(today);
      const alreadySent = await wasReminderDelivered(supabase, learnerProfile.id, "study", reminderKey);
      if (!alreadySent) {
        try {
          await sendWhatsappMessage({ to: phone, body: message });
          await logReminderDelivery(supabase, learnerProfile.id, "study", reminderKey, { kind: "study", date: today, taskCount: studyTasks.length });
          await supabase.from("learner_profiles").update({ whatsapp_last_study_reminder_at: today }).eq("id", learnerProfile.id);
          summary.studyMessagesSent += 1;
        } catch {
          // Keep dispatch moving even if one learner's WhatsApp send fails.
        }
      }
    }

    if (row.whatsapp_deadline_reminders) {
      const bursaryRows = await loadDueBursaryRemindersForLearner(supabase, learnerProfile.id, today);
      for (const bursaryReminder of bursaryRows) {
        const { bursary_id, days_before_deadline, bursaries } = bursaryReminder;
        const bursary = Array.isArray(bursaries) ? bursaries[0] : bursaries;
        if (!bursary?.deadline || !days_before_deadline) continue;

        const reminderDate = offsetDate(bursary.deadline, -days_before_deadline);
        if (reminderDate !== today) continue;

        const reminderKey = reminderKeyForBursary(bursary_id, bursary.deadline, days_before_deadline);
        const alreadySent = await wasReminderDelivered(supabase, learnerProfile.id, "deadline", reminderKey);
        if (alreadySent) continue;

        try {
          const bursaryForMessage = {
            name: bursary.name,
            provider: bursary.provider,
            applicationUrl: bursary.application_url,
            notes: bursary.notes ?? ""
          };
          await sendWhatsappMessage({
            to: phone,
            body: buildBursaryReminderMessage(bursaryForMessage, days_before_deadline, bursary.deadline)
          });
          await logReminderDelivery(supabase, learnerProfile.id, "deadline", reminderKey, {
            kind: "deadline",
            bursaryId: bursary_id,
            deadline: bursary.deadline,
            daysBeforeDeadline: days_before_deadline
          });
          await supabase.from("bursary_reminders").update({ last_sent_at: new Date().toISOString() }).eq("learner_id", learnerProfile.id).eq("bursary_id", bursary_id);
          summary.bursaryMessagesSent += 1;
          sentDeadlineForLearner = true;
        } catch {
          // Keep dispatch moving even if one bursary reminder fails.
        }
      }
    }

    if (sentDeadlineForLearner) {
      await supabase.from("learner_profiles").update({ whatsapp_last_deadline_reminder_at: today }).eq("id", learnerProfile.id);
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
    subjects
  };
}

async function loadStudyTasksForLearner(supabase: ReturnType<typeof getServiceSupabase>, learnerId: string, profile: LearnerProfile) {
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
        day: new Intl.DateTimeFormat("en-ZA", { weekday: "short", timeZone: timezone }).format(task.due_date ? new Date(task.due_date) : new Date()),
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
      send_whatsapp,
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
  return data.filter((row) => {
    const bursary = Array.isArray(row.bursaries) ? row.bursaries[0] : row.bursaries;
    if (!bursary?.deadline || !row.days_before_deadline) return false;
    return offsetDate(bursary.deadline, -row.days_before_deadline) === today;
  });
}

async function wasReminderDelivered(supabase: ReturnType<typeof getServiceSupabase>, learnerId: string, reminderType: string, reminderKey: string) {
  const { data, error } = await supabase
    .from("notification_deliveries")
    .select("id")
    .eq("learner_id", learnerId)
    .eq("channel", "whatsapp")
    .eq("reminder_type", reminderType)
    .eq("reminder_key", reminderKey)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

async function logReminderDelivery(
  supabase: ReturnType<typeof getServiceSupabase>,
  learnerId: string,
  reminderType: string,
  reminderKey: string,
  payload: Record<string, unknown>
) {
  await supabase.from("notification_deliveries").insert({
    learner_id: learnerId,
    channel: "whatsapp",
    reminder_type: reminderType,
    reminder_key: reminderKey,
    payload_json: payload,
    status: "sent"
  });
}

function offsetDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00+02:00`);
  value.setDate(value.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(value);
}

function todayInSouthAfrica() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

function mapTaskType(taskType: string): StudyTask["taskType"] {
  if (taskType === "assessment") return "assessment";
  if (taskType === "concept" || taskType === "practice" || taskType === "revision") return taskType;
  return "practice";
}
