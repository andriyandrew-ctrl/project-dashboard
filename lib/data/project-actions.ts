import { supabase } from '@/lib/supabase'

export interface NewProjectData {
  name: string;
  location?: string;
  description?: string;
  intent?: 'Delivery' | 'Experiment' | 'Internal';
  structure_type?: 'Linear' | 'Milestone';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  target_produksi?: string;
  target_revenue?: string;
  pic_name?: string;
  client?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export async function createProjectInDB(projectData: NewProjectData) {
  const randomCode = `PRJ-${Math.floor(10000 + Math.random() * 90000)}`
  const payload = {
    project_code: randomCode,
    name: projectData.name,
    location: projectData.location || '',
    description: projectData.description || '',
    intent: projectData.intent || 'Internal',
    structure_type: projectData.structure_type || 'Linear',
    target_produksi: projectData.target_produksi || '',
    target_revenue: projectData.target_revenue || '',
    status: 'todo',
    priority: projectData.priority || 'medium',
    pic_name: projectData.pic_name || 'Andri Setyawan',
    client: projectData.client || '',
    tags: projectData.tags || [],
    start_date: projectData.startDate,
    end_date: projectData.endDate,
    progress_percent: 0
  }

  const { data, error } = await supabase.from('projects').insert([payload]).select()
  if (error) throw new Error(`Database Error: ${error.message}`)
  return data[0]
}

export async function getAllProjects() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_scopes (*),
      tasks (*),
      project_files (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error("Gagal mengambil detail proyek:", error.message)
    return null
  }
  return data
}

export async function createTaskInDB(taskData: any) {
  const { data, error } = await supabase.from('tasks').insert([{
      project_id: taskData.project_id,
      name: taskData.name,
      phase: taskData.phase,
      assignee_id: taskData.assignee_id !== 'unassigned' ? taskData.assignee_id : null,
      start_date: taskData.start_date || new Date().toISOString(),
      end_date: taskData.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'todo',
      priority: 'medium'
    }]).select()
  if (error) throw new Error(`Database Error: ${error.message}`)
  return data[0]
}

export async function updateProjectScope(projectId: string, inScope: string[], outOfScope: string[]) {
  const { data: existingScope } = await supabase.from('project_scopes').select('id').eq('project_id', projectId).single()
  let result, error;
  if (existingScope) {
    const response = await supabase.from('project_scopes').update({ in_scope: inScope, out_of_scope: outOfScope }).eq('project_id', projectId).select();
    result = response.data; error = response.error;
  } else {
    const response = await supabase.from('project_scopes').insert([{ project_id: projectId, in_scope: inScope, out_of_scope: outOfScope }]).select();
    result = response.data; error = response.error;
  }
  if (error) throw new Error(`Database Error: ${error.message}`)
  return result;
}

// ==========================================
// FUNGSI BARU UNTUK ASSETS & FILES
// ==========================================
export async function saveProjectFileMetadata(data: {
  project_id: string;
  file_name: string;
  file_type: string;
  file_size_mb: number;
  file_url: string;
  storage_path: string;
  added_by: string;
}) {
  const { data: result, error } = await supabase.from('project_files').insert([data]).select();
  if (error) throw new Error(`DB Error: ${error.message}`);
  return result[0];
}

export async function deleteProjectFile(fileId: string) {
  const { error } = await supabase.from('project_files').delete().eq('id', fileId);
  if (error) throw new Error(error.message);
  return true;
}