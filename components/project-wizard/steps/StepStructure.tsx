import { CheckCircle, ArrowRight, FlagPennant, TreeStructure } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { ProjectData } from "../types";

type StepStructureProps = {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
};

export function StepStructure({ data, updateData }: StepStructureProps) {
  const options = [
    {
      id: "linear",
      title: "Linear",
      description: "Berjalan urut dari awal sampai akhir tanpa cabang (Cocok untuk proyek skala kecil).",
      icon: ArrowRight,
    },
    {
      id: "milestone",
      title: "Milestone-based",
      description: "Berbasis tahapan fase (Contoh: Engineering → Procurement → Construction).",
      icon: FlagPennant,
    },
    {
      id: "multistream",
      title: "Multi-stream",
      description: "Berjalan paralel (Contoh: Tim Produksi, Supply Chain, dan Marketing jalan bareng).",
      icon: TreeStructure,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-900/10">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pilih metode pelaksanaan proyek. Ini akan membantu sistem menyiapkan *template timeline* (Gantt Chart) yang paling sesuai untuk Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {options.map((opt) => {
          const isSelected = data.structure === opt.id;
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              role="button"
              tabIndex={0}
              onClick={() => updateData({ structure: opt.id as any })}
              className={cn(
                "relative flex cursor-pointer flex-col gap-3 rounded-xl p-4 text-left transition-all hover:bg-accent/50 border-2",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-background hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("rounded-lg p-2", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon className="h-5 w-5" />
                </div>
                {isSelected && <CheckCircle className="h-5 w-5 text-primary" weight="fill" />}
              </div>
              <div>
                <div className="font-medium text-foreground leading-snug">{opt.title}</div>
                <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{opt.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}