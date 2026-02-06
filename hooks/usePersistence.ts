
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient.ts';
import { Project } from '../types.ts';

export function usePersistence() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'local' | 'synced' | 'error'>('local');

  const loadProjects = async () => {
    setIsLoading(true);
    
    // 1. CARGA INSTANTÂNEA (LocalStorage)
    // Isso garante que o usuário nunca veja a tela "zerada" se já usou o app antes
    let localData: Project[] = [];
    try {
      const stored = localStorage.getItem('nexus_projects');
      if (stored) {
        localData = JSON.parse(stored);
        setProjects(localData);
      }
    } catch (e) {
      console.error("Local storage corrupt", e);
    }

    // 2. SINCRONIZAÇÃO EM BACKGROUND (Cloud)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: cloudData, error } = await supabase
          .from('projects')
          .select('*')
          .order('lastUpdated', { ascending: false });

        if (error) throw error;

        if (cloudData) {
          // Lógica de Merge: Compara Local vs Cloud usando timestamps
          const merged = [...localData];
          
          (cloudData as Project[]).forEach(cloudProj => {
            const localIndex = merged.findIndex(p => p.id === cloudProj.id);
            if (localIndex === -1) {
              merged.push(cloudProj);
            } else {
              // Se o da nuvem for mais novo que o local, atualiza
              const localDate = new Date(merged[localIndex].lastUpdated).getTime();
              const cloudDate = new Date(cloudProj.lastUpdated).getTime();
              if (cloudDate > localDate) {
                merged[localIndex] = cloudProj;
              }
            }
          });

          // Ordenar por data
          const finalData = merged.sort((a, b) => 
            new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
          );

          setProjects(finalData);
          localStorage.setItem('nexus_projects', JSON.stringify(finalData));
          setSyncStatus('synced');
        }
      } catch (err) {
        console.warn("Cloud sync failed, staying in Local Mode:", err);
        setSyncStatus('error');
      }
    }
    
    setIsLoading(false);
  };

  const saveProject = async (project: Project) => {
    // 1. Atualização UI Imediata e LocalStorage (Segurança Máxima)
    const updatedLocal = projects.find(p => p.id === project.id) 
      ? projects.map(p => p.id === project.id ? project : p) 
      : [project, ...projects];
    
    setProjects(updatedLocal);
    localStorage.setItem('nexus_projects', JSON.stringify(updatedLocal));

    // 2. Tentativa de persistência na Nuvem
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('projects').upsert(project);
        if (error) {
           console.error("Supabase Save Error:", error);
           setSyncStatus('error');
           // Retornamos sucesso pois o LocalStorage funcionou, mas avisamos do erro de rede internamente
           return { success: true, cloudError: error.message };
        }
        setSyncStatus('synced');
        return { success: true };
      } catch (err: any) {
        setSyncStatus('error');
        return { success: true, warning: "Offline save only" };
      }
    }
    return { success: true };
  };

  const deleteProject = async (id: string) => {
    const updatedLocal = projects.filter(p => p.id !== id);
    setProjects(updatedLocal);
    localStorage.setItem('nexus_projects', JSON.stringify(updatedLocal));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('projects').delete().eq('id', id);
      } catch (e) {
        console.error("Failed to delete from cloud");
      }
    }
    return { success: true };
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return { projects, isLoading, syncStatus, saveProject, deleteProject, refresh: loadProjects };
}
