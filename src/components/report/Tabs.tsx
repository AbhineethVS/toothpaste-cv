import { FileText, Flag, Images, LayoutGrid } from "lucide-react";

export type ReportTabId = "summary" | "findings" | "photos" | "report";

const TABS: { id: ReportTabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "summary", label: "Summary", icon: LayoutGrid },
  { id: "findings", label: "Findings", icon: Flag },
  { id: "photos", label: "Photos", icon: Images },
  { id: "report", label: "Report", icon: FileText },
];

export function Tabs({ active, onChange }: { active: ReportTabId; onChange: (tab: ReportTabId) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full border border-border-subtle bg-surface-card p-1">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-accent text-accent-ink" : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
