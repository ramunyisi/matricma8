import type { LearnerProfile, StudyTask } from "@/lib/types";
import { subjectRisk } from "@/lib/aps";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function generateLocalStudyPlan(profile: LearnerProfile): StudyTask[] {
  const sorted = [...profile.subjects].sort((a, b) => {
    const riskWeight = (value: string) => (value === "At Risk" ? 0 : value === "Watch" ? 1 : 2);
    return riskWeight(subjectRisk(a.currentMark, a.targetMark)) - riskWeight(subjectRisk(b.currentMark, b.targetMark));
  });

  return days.map((day, index) => {
    const subject = sorted[index % sorted.length];
    const risk = subjectRisk(subject.currentMark, subject.targetMark);
    return {
      day,
      subject: subject.name,
      topic: risk === "At Risk" ? "Core gaps and exam basics" : risk === "Watch" ? "Targeted past-paper practice" : "Revision and confidence check",
      taskType: index === 6 ? "assessment" : risk === "Safe" ? "revision" : "practice",
      durationMinutes: profile.internetAccessLevel === "low" ? 35 : 50
    };
  });
}
