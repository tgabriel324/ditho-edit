
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Project } from '../types';

export function usePersistence() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('lastUpdated', { ascending: false });

        if (!error && data) {
          setProjects(data as Project[]);
          return;
        }
      }
      
      // FALLBACK: LocalStorage se Supabase falhar ou não existir
      const local = localStorage.getItem('nexus_projects');
      if (local) {
        setProjects(JSON.parse(local));
      }
    } catch (err) {
      console.warn("Persistence fallback to LocalStorage active.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveProject = async (project: Project) => {
    // Atualiza estado local primeiro (UX rápida)
    setProjects(prev => {
      const exists = prev.find(p => p.id === project.id);
      const newState = exists ? prev.map(p => p.id === project.id ? project : p) : [project, ...prev];
      localStorage.setItem('nexus_projects', JSON.stringify(newState));
      return newState;
    });

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('projects').upsert(project);
        if (error) throw error;
      }
      return { success: true };
    } catch (err: any) {
      console.warn("Saved to LocalStorage (Cloud Sync Pending)");
      return { success: true, warning: "Offline mode" };
    }
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => {
      const newState = prev.filter(p => p.id !== id);
      localStorage.setItem('nexus_projects', JSON.stringify(newState));
      return newState;
    });

    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('projects').delete().eq('id', id);
      }
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return { projects, isLoading, saveProject, deleteProject, refresh: loadProjects };
}
