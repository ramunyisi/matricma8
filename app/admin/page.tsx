import { BookPlus, Database, GraduationCap, ListPlus, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { sampleApsRules, sampleBursaries, sampleQuestions, sampleSubjects } from "@/lib/sample-data";

const adminActions = [
  { title: "Add subjects", count: sampleSubjects.length, icon: GraduationCap },
  { title: "Add topics", count: 8, icon: ListPlus },
  { title: "Add past-paper metadata", count: sampleQuestions.length, icon: BookPlus },
  { title: "Add bursaries", count: sampleBursaries.length, icon: Database },
  { title: "Add university APS rules", count: sampleApsRules.length, icon: Database },
  { title: "View learner progress summary", count: 1, icon: Users }
];

export default function AdminPage() {
  return (
    <AppShell>
      <PageHeader title="Teacher/Admin Portal" eyebrow="Content operations">
        Admin workflows are scaffolded for controlled data entry. Production should add approval, audit logs, and source verification queues.
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.title}>
              <div className="flex items-start justify-between gap-3">
                <Icon className="text-veld" />
                <Badge tone="sample">{action.count} records</Badge>
              </div>
              <h2 className="mt-4 text-xl font-black">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">Use Supabase tables and RLS-backed admin forms for verified content entry.</p>
              <button className="focus-ring mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">Open form</button>
            </Card>
          );
        })}
      </div>
      <Card className="mt-4">
        <h2 className="text-xl font-black">Learner progress summary</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-chalk text-ink/70">
              <tr>
                <th className="p-3">Learner</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Risk subjects</th>
                <th className="p-3">APS estimate</th>
                <th className="p-3">Next action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-ink/10">
                <td className="p-3 font-bold">Demo learner</td>
                <td className="p-3">12</td>
                <td className="p-3">Mathematics, Physical Sciences</td>
                <td className="p-3">31</td>
                <td className="p-3">Review weekly plan and latest marks</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
