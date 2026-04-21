"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Stepper } from "./Stepper";
import { ProjectData } from "./types";

import { StepIntent } from "./steps/StepIntent";
import { StepOutcome } from "./steps/StepOutcome";
import { StepOwnership } from "./steps/StepOwnership";
import { StepStructure } from "./steps/StepStructure";
import { StepReview } from "./steps/StepReview";
import { CaretLeft, CaretRight, X, Spinner } from "@phosphor-icons/react/dist/ssr";

// IMPORT DB PIPELINE
import { createProjectInDB, updateProjectScope } from "@/lib/data/project-actions";

interface ProjectWizardProps {
  onClose: () => void;
  onCreate?: () => void;
}

export function ProjectWizard({ onClose, onCreate }: ProjectWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [data, setData] = useState<ProjectData>({
    name: '',
    successType: 'undefined',
    deliverables: [],
    metrics: [],
    description: '',
    deadlineType: 'none',
    contributorIds: [],
    stakeholderIds: [],
    addStarterTasks: false,
  });

  const updateData = (updates: Partial<ProjectData>) => setData(prev => ({ ...prev, ...updates }));

  const nextStep = () => {
    if (step === 1 && (!data.name || data.name.trim() === '')) {
       toast.error("Judul Proyek wajib diisi!");
       return;
    }
    setStep(prev => {
        const next = prev + 1;
        setMaxStepReached(m => Math.max(m, next));
        return next;
    });
  };

  const prevStep = () => { if (step > 1) setStep(prev => prev - 1); };
  const jumpToStep = (s: number) => { setStep(s + 1); }
  const handleEditStepFromReview = (targetStep: number) => { setStep(targetStep); };
  const isNextDisabled = () => {
      if (step === 1 && !data.name) return true;
      if (step === 3 && !data.pic) return true;
      return false;
  }

  const handleSaveToDatabase = async () => {
    setIsSubmitting(true);
    try {
      let formattedIntent: 'Delivery' | 'Experiment' | 'Internal' = 'Internal';
      if (data.intent === 'delivery') formattedIntent = 'Delivery';
      if (data.intent === 'experiment') formattedIntent = 'Experiment';

      let formattedStructure: 'Linear' | 'Milestone' = 'Linear';
      if (data.structure === 'milestone') formattedStructure = 'Milestone';

      // 1. Simpan Proyek ke tabel 'projects'
      const newProject = await createProjectInDB({
        name: data.name || "Untitled Project",
        location: (data.city && data.province) ? `${data.city}, ${data.province}` : "",
        description: data.description || "",
        intent: formattedIntent,
        structure_type: formattedStructure,
        target_produksi: data.targetProduksi || "",
        target_revenue: data.targetRevenue || "",
        pic_name: data.pic || "",
        client: data.client || "",
        priority: "medium", 
        startDate: new Date().toISOString(),
        endDate: data.targetDeadline ? new Date(data.targetDeadline).toISOString() : new Date().toISOString(),
        // Catatan: Supabase kita belum punya kolom 'location', jadi saya belum oper data.location ke sini. 
        // Nanti kita buatkan kolomnya di Supabase!
      });
      
      // 2. Jika proyek berhasil dibuat, Simpan Scope of Work-nya
      if (newProject && newProject.id) {
         const inScopeArr = data.inScope ? data.inScope.split('\n').map(s => s.trim()).filter(s => s !== '') : [];
         const outOfScopeArr = data.outOfScope ? data.outOfScope.split('\n').map(s => s.trim()).filter(s => s !== '') : [];
         
         if (inScopeArr.length > 0 || outOfScopeArr.length > 0) {
             await updateProjectScope(newProject.id, inScopeArr, outOfScopeArr);
         }
      }

      toast.success("Proyek baru berhasil dibuat beserta Scope-nya!");
      
      // PERBAIKAN ERROR DI SINI: ganti handleClose() jadi onClose()
      if (onCreate) onCreate(); else onClose(); 
      
    } catch (error) {
      toast.error("Gagal menyimpan data ke database.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Detail Proyek", "Target & KPI", "PIC & Partner", "Struktur Kerja", "Review & Simpan"];
  const stepTitles: Record<number, string> = {
    1: "Detail Proyek & Tujuan Utama",
    2: "Target, KPI, dan Ruang Lingkup",
    3: "Siapa PIC dan Partner yang bertanggung jawab?",
    4: "Bagaimana tahapan atau fase kerjanya?",
    5: "Review Detail Proyek",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1, height: "auto" }} transition={{ duration: 0.3 }} className="flex w-full max-w-[900px] max-h-[85vh] overflow-hidden rounded-[24px] bg-background shadow-2xl">
        <div className="hidden w-64 border-r border-border bg-background px-6 py-7 md:flex md:flex-col md:gap-7">
          <p className="text-sm font-semibold text-foreground">Setup Proyek Baru</p>
          <Stepper currentStep={step - 1} steps={steps} onStepClick={jumpToStep} maxStepReached={maxStepReached - 1} />
        </div>

        <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between px-8 pt-6 pb-4 shrink-0">
                <h2 className="text-lg font-bold tracking-tight text-foreground">{stepTitles[step]}</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-0">
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="h-full">
                        {step === 1 && <StepIntent data={data} updateData={updateData} />}
                        {step === 2 && <StepOutcome data={data} updateData={updateData} />}
                        {step === 3 && <StepOwnership data={data} updateData={updateData} />}
                        {step === 4 && <StepStructure data={data} updateData={updateData} />}
                        {step === 5 && <StepReview data={data} onEditStep={handleEditStepFromReview} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between bg-muted/20 p-6 shrink-0 border-t border-border/40">
                <div>{step > 1 && <Button variant="outline" className="bg-background" onClick={prevStep}><CaretLeft className="mr-1 h-4 w-4" /> Kembali</Button>}</div>
                <div className="flex gap-3">
                    {step === 5 ? (
                        <>
                            <Button variant="outline" className="bg-background">Simpan sbg Template</Button>
                            <Button onClick={handleSaveToDatabase} disabled={isSubmitting}>{isSubmitting ? <Spinner className="animate-spin mr-2" /> : null} Simpan Proyek</Button>
                        </>
                    ) : (
                        <Button onClick={nextStep} disabled={isNextDisabled()}>Lanjut <CaretRight className="ml-1 h-4 w-4" /></Button>
                    )}
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}