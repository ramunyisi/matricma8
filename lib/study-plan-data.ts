import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearnerProfile, StudyTask } from "@/lib/types";
import { generateLocalStudyPlan } from "@/lib/study-plan";

const dayOffsets: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6
};

export function weekStartDate(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy.toISOString().slice(0, 10);
}

export async function loadOrCreateStudyPlan(supabase: SupabaseClient | null, profile: LearnerProfile) {
  const fallback = generateLocalStudyPlan(profile);
  if (!supabase || profile.id === "demo-learner") return fallback;

  const weekStart = weekStartDate();
  const { data: existingPlan, error: planError } = await supabase
    .from("study_plans")
    .select("id,plan_json,study_tasks(id,topic,task_type,due_date,completed,subjects(name))")
    .eq("learner_id", profile.id)
    .eq("week_start", weekStart)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) throw new Error(planError.message);
  if (existingPlan) return mapStoredTasks(existingPlan.study_tasks, fallback);

  return saveStudyPlan(supabase, profile, fallback, weekStart);
}

export async function saveStudyPlan(supabase: SupabaseClient, profile: LearnerProfile, tasks: StudyTask[], weekStart = weekStartDate()) {
  const { error: deleteError } = await supabase
    .from("study_plans")
    .delete()
    .eq("learner_id", profile.id)
    .eq("week_start", weekStart);

  if (deleteError) throw new Error(deleteError.message);

  const { data: plan, error: planError } = await supabase
    .from("study_plans")
    .insert({
      learner_id: profile.id,
      week_start: weekStart,
      plan_json: { tasks, generatedAt: new Date().toISOString() }
    })
    .select("id")
    .single();

  if (planError) throw new Error(planError.message);

  const start = new Date(`${weekStart}T00:00:00`);
  const rows = tasks.map((task) => {
    const subject = profile.subjects.find((item) => item.name === task.subject);
    const dueDate = new Date(start);
    dueDate.setDate(start.getDate() + (dayOffsets[task.day] ?? 0));
    return {
      study_plan_id: plan.id,
      subject_id: subject?.subjectId ?? null,
      topic: task.topic,
      task_type: task.taskType,
      due_date: task.dueDate ?? dueDate.toISOString().slice(0, 10),
      completed: Boolean(task.completed)
    };
  });

  const { error: taskError } = await supabase.from("study_tasks").insert(rows);
  if (taskError) throw new Error(taskError.message);

  return tasks;
}

export async function updateStudyTaskCompletion(supabase: SupabaseClient, taskId: string, completed: boolean) {
  const { error } = await supabase.from("study_tasks").update({ completed }).eq("id", taskId);
  if (error) throw new Error(error.message);
}

function mapStoredTasks(rows: any[] | null, fallback: StudyTask[]): StudyTask[] {
  if (!rows || rows.length === 0) return fallback;
  return rows.map((row, index) => {
    const subject = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
    return {
      id: row.id,
      day: fallback[index]?.day ?? dayLabel(row.due_date),
      subject: subject?.name ?? fallback[index]?.subject ?? "Study",
      topic: row.topic,
      taskType: row.task_type,
      durationMinutes: fallback[index]?.durationMinutes ?? 45,
      dueDate: row.due_date,
      completed: row.completed
    };
  });
}

function dayLabel(date?: string) {
  if (!date) return "Task";
  return new Intl.DateTimeFormat("en-ZA", { weekday: "short" }).format(new Date(date));
}
