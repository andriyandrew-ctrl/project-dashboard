import { CheckCircle, Factory, Flask, Gear, MapPin } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { ProjectData } from "../types";
import { INDONESIA_LOCATIONS } from "@/lib/data/locations"; // Import kamus kita!

type StepIntentProps = {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
};

export function StepIntent({ data, updateData }: StepIntentProps) {
  const options = [
    { id: "delivery", title: (<><span className="block">Delivery</span><span className="block">(Eksekusi)</span></>), description: "Pembangunan, Produksi (Contoh: Bangun Pabrik).", icon: Factory },
    { id: "experiment", title: (<><span className="block">Eksperimen</span><span className="block">(Riset)</span></>), description: "Trial, Testing (Contoh: Uji Material Baru).", icon: Flask },
    { id: "internal", title: (<><span className="block">Internal</span><span className="block">(Operasional)</span></>), description: "Efisiensi, SOP (Contoh: Optimasi Proses).", icon: Gear },
  ] as const;

  // Mengambil daftar provinsi dari file kamus
  const provinces = Object.keys(INDONESIA_LOCATIONS);
  // Mengambil daftar kota berdasarkan provinsi yang dipilih (jika ada)
  const availableCities = data.province ? INDONESIA_LOCATIONS[data.province] : [];

  return (
    <div className="space-y-5">
      
      {/* 1. INPUT JUDUL PROYEK */}
      <div className="space-y-2.5">
        <label className="text-sm font-bold text-foreground">Judul Proyek</label>
        <input
          type="text"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Contoh: Riset Kapal Baja 4mm"
          value={data.name || ""}
          onChange={(e) => updateData({ name: e.target.value })}
          autoFocus
        />
      </div>

      {/* 2. LOKASI PROYEK (Dropdown Bertingkat) */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Lokasi Proyek
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Dropdown Provinsi */}
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={data.province || ""}
            onChange={(e) => {
              // Jika provinsi diganti, reset pilihan kota agar tidak salah pasangkan
              updateData({ province: e.target.value, city: "" });
            }}
          >
            <option value="" disabled>-- Pilih Provinsi --</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>

          {/* Dropdown Kota */}
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-muted"
            value={data.city || ""}
            onChange={(e) => updateData({ city: e.target.value })}
            disabled={!data.province} // Disable jika provinsi belum dipilih
          >
            <option value="" disabled>{data.province ? "-- Pilih Kota/Kabupaten --" : "Pilih Provinsi Dulu"}</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. INPUT DESKRIPSI PROYEK */}
      <div className="space-y-2.5">
        <label className="text-sm font-bold text-foreground">Deskripsi Proyek</label>
        <textarea
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
          placeholder='Contoh: "Meningkatkan kapasitas produksi HRC sebesar 20%..."'
          value={data.description || ""}
          onChange={(e) => updateData({ description: e.target.value })}
        />
      </div>

      {/* 4. OPSI KATEGORI */}
      <div className="space-y-2.5 pt-1">
        <label className="text-sm font-bold text-foreground">Kategori Proyek</label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {options.map((opt) => {
            const isSelected = data.intent === opt.id;
            const Icon = opt.icon;
            return (
              <div key={opt.id} role="button" onClick={() => updateData({ intent: opt.id })} className={cn("relative flex cursor-pointer flex-col gap-3 rounded-xl p-4 text-left transition-all hover:bg-accent/50 border-2", isSelected ? "border-primary bg-primary/5" : "border-border/50 bg-background hover:border-primary/50")}>
                <div className="flex items-center justify-between">
                  <div className={cn("rounded-lg p-2", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="h-5 w-5" /></div>
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
    </div>
  );
}