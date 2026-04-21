import { UserCircle, Handshake, Buildings } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { ProjectData } from "../types";

type StepOwnershipProps = {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
};

export function StepOwnership({ data, updateData }: StepOwnershipProps) {
  return (
    <div className="space-y-6">
      {/* Kotak Informasi Tambahan */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-900/10">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tentukan siapa yang akan memimpin eksekusi proyek dari internal tim, siapa mitra kerja yang berkolaborasi, dan untuk siapa proyek ini dibangun.
        </p>
      </div>

      <div className="space-y-5">
        {/* INPUT 1: PIC (Person In Charge) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <UserCircle className="h-5 w-5 text-primary" weight="fill" />
            PIC (Person In Charge) - Internal Tim
          </label>
          <input
            type="text"
            placeholder="Contoh: Mohammad Ivan Effendy Putra"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={data.pic || ""}
            onChange={(e) => updateData({ pic: e.target.value })}
          />
        </div>

        {/* INPUT 2: PARTNER */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Handshake className="h-5 w-5 text-orange-500" weight="fill" />
            Partner / Mitra Kerja
          </label>
          <input
            type="text"
            placeholder="Contoh: KBK | Vendor Tambang"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={data.partner || ""}
            onChange={(e) => updateData({ partner: e.target.value })}
          />
        </div>

        {/* INPUT 3: CLIENT / INTERNAL USER */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Buildings className="h-5 w-5 text-teal-500" weight="fill" />
            Client / Pemilik Proyek
          </label>
          <input
            type="text"
            placeholder="Contoh: Kementerian PUPR / PT Wilmar"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={data.client || ""}
            onChange={(e) => updateData({ client: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}