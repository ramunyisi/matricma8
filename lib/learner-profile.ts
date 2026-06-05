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
        exam_date: input.examDate || null
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
        id: subject?.id ?? item.id,
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
    subjects
  };
}
