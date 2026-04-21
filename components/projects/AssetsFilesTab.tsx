"use client";

import { useState, useRef } from "react";
import { File, FilePdf, Image as ImageIcon, Trash, DownloadSimple, Plus, Spinner } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { saveProjectFileMetadata, deleteProjectFile } from "@/lib/data/project-actions";

type FileItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  path: string;
  addedBy: string;
  date: string;
};

export function AssetsFilesTab({ projectId, files: initialFiles }: { projectId: string; files: FileItem[] }) {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // 1. Upload ke Supabase Storage (Bucket project_assets)
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`; // Folder-nya sesuai ID Project

      const { error: uploadError } = await supabase.storage
        .from('project_assets')
        .upload(filePath, selectedFile);

      if (uploadError) throw new Error(uploadError.message);

      // 2. Dapatkan URL Public agar bisa didownload
      const { data: urlData } = supabase.storage
        .from('project_assets')
        .getPublicUrl(filePath);

      // 3. Simpan Metadata ke Database (project_files)
      const sizeMb = parseFloat((selectedFile.size / (1024 * 1024)).toFixed(2));
      const newFileMeta = await saveProjectFileMetadata({
        project_id: projectId,
        file_name: selectedFile.name,
        file_type: selectedFile.type || 'unknown',
        file_size_mb: sizeMb,
        file_url: urlData.publicUrl,
        storage_path: filePath,
        added_by: "Andri Setyawan", // Nama Bapak terpasang default
      });

      // 4. Update tampilan langsung tanpa refresh
      setFiles(prev => [{
        id: newFileMeta.id,
        name: newFileMeta.file_name,
        type: newFileMeta.file_type,
        size: `${newFileMeta.file_size_mb} MB`,
        url: newFileMeta.file_url,
        path: newFileMeta.storage_path,
        addedBy: newFileMeta.added_by,
        date: new Date(newFileMeta.created_at).toLocaleDateString('id-ID')
      }, ...prev]);

      toast.success("File berhasil diunggah ke Cloud Storage!");
    } catch (error: any) {
      toast.error(`Gagal mengunggah: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (!confirm("Yakin ingin menghapus file ini?")) return;
    try {
      // Hapus fisik dari Storage
      await supabase.storage.from('project_assets').remove([path]);
      // Hapus data dari Database
      await deleteProjectFile(id);
      
      setFiles(prev => prev.filter(f => f.id !== id));
      toast.success("File berhasil dihapus dari sistem!");
    } catch (error: any) {
      toast.error("Gagal menghapus file.");
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <FilePdf className="h-8 w-8 text-red-500" weight="duotone" />;
    if (type.includes('image')) return <ImageIcon className="h-8 w-8 text-blue-500" weight="duotone" />;
    return <File className="h-8 w-8 text-slate-500" weight="duotone" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
        <div>
          <h3 className="text-sm font-bold text-foreground">Dokumen & Aset Proyek</h3>
          <p className="text-xs text-muted-foreground mt-1">Upload RAB, gambar DWG, atau kontrak kerja di sini (Maks 50MB).</p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.jpg,.jpeg,.png,.zip" 
        />
        
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" weight="bold" />}
          {isUploading ? "Mengunggah..." : "Upload File"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
            <File className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground font-medium">Belum ada file yang diunggah.</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="group relative flex items-start gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/30">
              <div className="shrink-0">{getIcon(file.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate" title={file.name}>{file.name}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span>{file.date}</span>
                </div>
              </div>
              
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card/80 backdrop-blur-sm p-1 rounded-lg border border-border shadow-sm">
                <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => window.open(file.url, '_blank')} title="Download / Buka File">
                  <DownloadSimple className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => handleDelete(file.id, file.path)} title="Hapus File">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}