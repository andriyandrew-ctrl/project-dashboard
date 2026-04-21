import { CheckCircle, Package, ChartLineUp, Question } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { ProjectData } from "../types";

type StepOutcomeProps = {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
};

export function StepOutcome({ data, updateData }: StepOutcomeProps) {
  const options = [
    { id: "deliverable", title: "Berbasis Deliverable", description: "Hasil Fisik (Pabrik Jadi).", icon: Package },
    { id: "kpi", title: "Berbasis KPI", description: "Peningkatan Kinerja (Efisiensi 20%).", icon: ChartLineUp },
    { id: "undefined", title: "Belum Ditentukan", description: "Ditentukan kemudian.", icon: Question },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {options.map((opt) => {
          const isSelected = data.successType === opt.id;
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              role="button"
              onClick={() => updateData({ successType: opt.id as any })}
              className={cn("relative flex cursor-pointer flex-col gap-3 rounded-xl p-4 text-left border-2", isSelected ? "border-primary bg-primary/5" : "border-border/50 bg-background hover:border-primary/50")}
            >
              <div className="flex items-center justify-between">
                <div className={cn("rounded-lg p-2", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="h-5 w-5" /></div>
                {isSelected && <CheckCircle className="h-5 w-5 text-primary" weight="fill" />}
              </div>
              <div>
                <div className="font-medium text-foreground">{opt.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{opt.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">Target Deadline</label>
          <input type="date" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary" value={data.targetDeadline || ""} onChange={(e) => updateData({ targetDeadline: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">Target Produksi <span className="font-normal text-muted-foreground">(Opsional)</span></label>
          <input type="text" placeholder="150 Ton/Bulan" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary" value={data.targetProduksi || ""} onChange={(e) => updateData({ targetProduksi: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">Target Revenue <span className="font-normal text-muted-foreground">(Opsional)</span></label>
          <input type="text" placeholder="Rp 5 Miliar" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary" value={data.targetRevenue || ""} onChange={(e) => updateData({ targetRevenue: e.target.value })} />
        </div>
      </div>

      {/* SCOPE OF WORK (BARU) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2 border-t border-border/50 pt-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Termasuk Lingkup (In Scope)</label>
          <textarea
            className="w-full rounded-lg border border-emerald-200 bg-emerald-50/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500/50 h-24 resize-none"
            placeholder="Gunakan 'Enter' untuk baris baru&#10;Contoh:&#10;Pembangunan fasilitas&#10;Instalasi mesin"
            value={data.inScope || ""}
            onChange={(e) => updateData({ inScope: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-orange-600 uppercase tracking-wider">Di Luar Lingkup (Out Scope)</label>
          <textarea
            className="w-full rounded-lg border border-orange-200 bg-orange-50/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-orange-500/50 h-24 resize-none"
            placeholder="Gunakan 'Enter' untuk baris baru&#10;Contoh:&#10;Perizinan lahan&#10;Biaya pemasaran"
            value={data.outOfScope || ""}
            onChange={(e) => updateData({ outOfScope: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}