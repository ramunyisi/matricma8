import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { InternetAccessLevel, LearnerProfile, LearnerSubject } from "@/lib/types";
import { demoProfile } from "@/lib/sample-data";

type LearnerProfileRow = {
  id: string;
  grade: 10 | 11 | 12;
  province: string;
  school_name: string | null;
  home_language: string;
  internet_access_level: InternetAccessLevel;
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

export type OnboardingSubjectInput = {
  name: string;
  currentMark: number;
  targetMark: number;
};

export type OnboardingProfileInput = {
  grade: 10 | 11 | 12;
  province: string;
  schoolName?: string;
  homeLanguage: string;
  internetAccessLevel: InternetAccessLevel;
  careerInterests: string[];
  preferredStudyTimes: string[];
  examDate?: string;
  whatsappPhone?: string;
  whatsappOptIn?: boolean;
  whatsappStudyReminders?: boolean;
  whatsappDeadlineReminders?: boolean;
  reminderEmail?: string;
  fallbackEmailEnabled?: boolean;
  reminderTimezone?: string;
  reminderPausedUntil?: string;
  studyReminderHour?: number;
  deadlineReminderHour?: number;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  subjects: OnboardingSubjectInput[];
};

export async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getLearnerProfile(supabase: SupabaseClient, userId: string): Promise<LearnerProfile | null> {
  const { data, error } = await supabase
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
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapProfileRow(data as unknown as LearnerProfileRow) : null;
}

export async function saveLearnerProfile(supabase: SupabaseClient, user: User, input: OnboardingProfileInput) {
  const { data: profile, error: profileError } = await supabase
    .from("learner_profiles")
    .upsert(
      {
        user_id: user.id,
        grade: input.grade,
        province: input.province,
        school_name: input.schoolName || null,
        home_language: input.homeLanguage,
        internet_access_level: input.internetAccessLevel,
        career_interests: input.careerInterests,
        preferred_study_times: input.preferredStudyTimes,
        exam_date: input.examDate || null,
        whatsapp_phone: input.whatsappPhone?.trim() || null,
        whatsapp_opt_in: Boolean(input.whatsappOptIn && input.whatsappPhone),
        whatsapp_study_reminders: Boolean(input.whatsappOptIn && input.whatsappStudyReminders && input.whatsappPhone),
        whatsapp_deadline_reminders: Boolean(input.whatsappOptIn && input.whatsappDeadlineReminders && input.whatsappPhone),
        reminder_email: input.reminderEmail?.trim() || null,
        fallback_email_enabled: Boolean(input.fallbackEmailEnabled && input.reminderEmail),
        reminder_timezone: input.reminderTimezone || "Africa/Johannesburg",
        reminder_paused_until: input.reminderPausedUntil || null,
        study_reminder_hour: input.studyReminderHour ?? 18,
        deadline_reminder_hour: input.deadlineReminderHour ?? 10,
        quiet_hours_start: input.quietHoursStart ?? 20,
        quiet_hours_end: input.quietHoursEnd ?? 6
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const subjectNames = input.subjects.map((subject) => subject.name);
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id,name")
    .eq("grade", input.grade)
    .in("name", subjectNames);

  if (subjectsError) {
    throw new Error(subjectsError.message);
  }

  const missingSubjects = subjectNames.filter((name) => !subjects?.some((subject) => subject.name === name));
  if (missingSubjects.length > 0) {
    throw new Error(`Missing seeded subjects for Grade ${input.grade}: ${missingSubjects.join(", ")}. Run the Supabase seed first.`);
  }

  const rows = input.subjects.map((subject) => {
    const storedSubject = subjects?.find((item) => item.name === subject.name);
    return {
      learner_id: profile.id,
      subject_id: storedSubject?.id,
      current_mark: subject.currentMark,
      target_mark: subject.targetMark
    };
  });

  const { error: deleteError } = await supabase.from("learner_subjects").delete().eq("learner_id", profile.id);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: insertError } = await supabase.from("learner_subjects").insert(rows);
  if (insertError) {
    throw new Error(insertError.message);
  }

  return profile.id as string;
}

export function buildDemoProfileFromInput(input: OnboardingProfileInput): LearnerProfile {
  return {
    ...demoProfile,
    grade: input.grade,
    province: input.province,
    schoolName: input.schoolName,
    homeLanguage: input.homeLanguage,
    internetAccessLevel: input.internetAccessLevel,
    careerInterests: input.careerInterests,
    preferredStudyTimes: input.preferredStudyTimes,
    examDate: input.examDate || demoProfile.examDate,
    whatsappPhone: input.whatsappPhone || demoProfile.whatsappPhone,
    whatsappOptIn: Boolean(input.whatsappOptIn && input.whatsappPhone),
    whatsappStudyReminders: Boolean(input.whatsappOptIn && input.whatsappStudyReminders && input.whatsappPhone),
    whatsappDeadlineReminders: Boolean(input.whatsappOptIn && input.whatsappDeadlineReminders && input.whatsappPhone),
    reminderEmail: input.reminderEmail || demoProfile.reminderEmail,
    fallbackEmailEnabled: Boolean(input.fallbackEmailEnabled && input.reminderEmail),
    reminderTimezone: input.reminderTimezone || demoProfile.reminderTimezone,
    reminderPausedUntil: input.reminderPausedUntil || demoProfile.reminderPausedUntil,
    studyReminderHour: input.studyReminderHour ?? demoProfile.studyReminderHour,
    deadlineReminderHour: input.deadlineReminderHour ?? demoProfile.deadlineReminderHour,
    quietHoursStart: input.quietHoursStart ?? demoProfile.quietHoursStart,
    quietHoursEnd: input.quietHoursEnd ?? demoProfile.quietHoursEnd,
    subjects: input.subjects.map((subject, index) => ({
      id: `demo-${index}`,
      name: subject.name,
      grade: input.grade,
      currentMark: subject.currentMark,
      targetMark: subject.targetMark
    }))
  };
}

function mapProfileRow(row: LearnerProfileRow): LearnerProfile {
  const subjects: LearnerSubject[] = (row.learner_subjects ?? [])
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
    examDate: row.exam_date ?? demoProfile.examDate,
    whatsappPhone: row.whatsapp_phone ?? "",
    whatsappOptIn: Boolean(row.whatsapp_opt_in),
    whatsappStudyReminders: Boolean(row.whatsapp_study_reminders),
    whatsappDeadlineReminders: Boolean(row.whatsapp_deadline_reminders),
    reminderEmail: row.reminder_email ?? "",
    fallbackEmailEnabled: Boolean(row.fallback_email_enabled),
    reminderTimezone: row.reminder_timezone ?? "Africa/Johannesburg",
    reminderPausedUntil: row.reminder_paused_until ?? "",
    studyReminderHour: row.study_reminder_hour ?? 18,
    deadlineReminderHour: row.deadline_reminder_hour ?? 10,
    quietHoursStart: row.quiet_hours_start ?? 20,
    quietHoursEnd: row.quiet_hours_end ?? 6,
    subjects
  };
}

export async function saveReminderSettings(
  supabase: SupabaseClient,
  user: User,
  input: {
    whatsappPhone?: string;
    whatsappOptIn?: boolean;
    whatsappStudyReminders?: boolean;
    whatsappDeadlineReminders?: boolean;
    reminderEmail?: string;
    fallbackEmailEnabled?: boolean;
    reminderTimezone?: string;
    reminderPausedUntil?: string;
    studyReminderHour?: number;
    deadlineReminderHour?: number;
    quietHoursStart?: number;
    quietHoursEnd?: number;
  }
) {
  const { error } = await supabase
    .from("learner_profiles")
    .update({
      whatsapp_phone: input.whatsappPhone?.trim() || null,
      whatsapp_opt_in: Boolean(input.whatsappOptIn && input.whatsappPhone),
      whatsapp_study_reminders: Boolean(input.whatsappOptIn && input.whatsappStudyReminders && input.whatsappPhone),
      whatsapp_deadline_reminders: Boolean(input.whatsappOptIn && input.whatsappDeadlineReminders && input.whatsappPhone),
      reminder_email: input.reminderEmail?.trim() || null,
      fallback_email_enabled: Boolean(input.fallbackEmailEnabled && input.reminderEmail),
      reminder_timezone: input.reminderTimezone || "Africa/Johannesburg",
      reminder_paused_until: input.reminderPausedUntil || null,
      study_reminder_hour: input.studyReminderHour ?? 18,
      deadline_reminder_hour: input.deadlineReminderHour ?? 10,
      quiet_hours_start: input.quietHoursStart ?? 20,
      quiet_hours_end: input.quietHoursEnd ?? 6
    })
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateLearnerSubjectMarks(supabase: SupabaseClient, profileId: string, subjects: LearnerSubject[]) {
  for (const subject of subjects) {
    const { error } = await supabase
      .from("learner_subjects")
      .update({
        current_mark: subject.currentMark,
        target_mark: subject.targetMark
      })
      .eq("id", subject.id)
      .eq("learner_id", profileId);

    if (error) {
      throw new Error(error.message);
    }

    if (subject.subjectId) {
      const { error: markError } = await supabase.from("marks").insert({
        learner_id: profileId,
        subject_id: subject.subjectId,
        assessment_type: "APS update",
        mark: subject.currentMark,
        assessment_date: new Date().toISOString().slice(0, 10)
      });

      if (markError) {
        throw new Error(markError.message);
      }
    }
  }
}
