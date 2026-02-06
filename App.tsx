
import React, { useState, useCallback, Suspense, useEffect, useRef } from 'react';
import { usePersistence } from './hooks/usePersistence.ts';
import { DashboardView } from './views/DashboardView.tsx';
import { EditorView } from './views/EditorView.tsx';
import { AssetsView } from './views/AssetsView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { analyzeDesignSystem } from './services/geminiService.ts';
import { Project, ViewMode } from './types.ts';

type SidebarTab = 'HOME' | 'EDITOR' | 'ASSETS' | 'SETTINGS';

const tokenizeHtmlColors = (html: string): { processedHtml: string; variables: Record<string, string> } => {
  const colorRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  const matches = html.match(colorRegex) || [];
  const colorCounts: Record<string, number> = {};
  matches.forEach(c => {
    const color = c.toLowerCase();
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });
  const uniqueColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
  const topColors = uniqueColors.slice(0, 8);
  const variables: Record<string, string> = {};
  let processedHtml = html;
  topColors.forEach((color, index) => {
    const varName = `--nx-c-${index}`;
    variables[varName] = color;
    const regex = new RegExp(color, 'gi');
    processedHtml = processedHtml.replace(regex, `var(${varName})`);
  });
  return { processedHtml, variables };
};

export default function App() {
  const { projects, isLoading, syncStatus, saveProject, deleteProject } = usePersistence();
  const [activeTab, setActiveTab] = useState<SidebarTab>('HOME');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [lastSaved, setLastSaved] = useState<string>('');
  const autoSaveTimerRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DESKTOP);
  const [zoom, setZoom] = useState(1);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // --- CAPTURA DE DOM REAL ---
  const captureCurrentHtml = useCallback(() => {
    const canvasFrame = document.querySelector('iframe') as HTMLIFrameElement;
    if (canvasFrame && canvasFrame.contentDocument) {
      const docClone = canvasFrame.contentDocument.documentElement.cloneNode(true) as HTMLElement;
      docClone.querySelectorAll('.nexus-selected-outline, .nexus-hover-outline, .nexus-editing').forEach(el => {
        el.classList.remove('nexus-selected-outline', 'nexus-hover-outline', 'nexus-editing');
      });
      return "<!DOCTYPE html>\n" + docClone.outerHTML;
    }
    return activeProject?.html || '';
  }, [activeProject]);

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    if (activeProject && activeTab === 'EDITOR') {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
      
      autoSaveTimerRef.current = window.setTimeout(async () => {
        const currentHtml = captureCurrentHtml();
        const updated = { ...activeProject, html: currentHtml, lastUpdated: new Date().toISOString() };
        await saveProject(updated);
        setLastSaved(new Date().toLocaleTimeString());
      }, 5000); // 5 segundos de inatividade para auto-save silencioso
    }
    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [activeProject, activeTab, captureCurrentHtml, saveProject]);

  const handleCreateNew = async (inputHtml: string) => {
    const { processedHtml, variables } = tokenizeHtmlColors(inputHtml);
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: `New Project ${projects.length + 1}`,
      subdomain: `site-${Math.random().toString(36).substr(2, 4)}`,
      html: processedHtml,
      designSystem: { colors: [], fonts: [], sections: [], variables },
      lastUpdated: new Date().toISOString()
    };

    setActiveProject(newProject);
    setActiveTab('EDITOR');
    await saveProject(newProject);

    setIsAnalyzing(true);
    try {
      const ds = await analyzeDesignSystem(inputHtml);
      const finalDS = { ...newProject.designSystem, ...ds, variables: newProject.designSystem.variables };
      const updatedProject = { ...newProject, designSystem: finalDS };
      setActiveProject(updatedProject);
      await saveProject(updatedProject);
    } catch (e) {
      console.error("AI Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSave = async () => {
    if (!activeProject) return;
    const currentHtml = captureCurrentHtml();
    const updated = { ...activeProject, html: currentHtml, lastUpdated: new Date().toISOString() };
    setActiveProject(updated);
    const res = await saveProject(updated);
    if (res.success) {
      setLastSaved(new Date().toLocaleTimeString());
      alert("Project saved successfully!");
    }
  };

  const handleForceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
    const cleanHtml = captureCurrentHtml();
    setActiveProject(prev => prev ? { ...prev, html: cleanHtml } : null);
  }, [captureCurrentHtml]);

  const handleVariableUpdate = (varName: string, newVal: string) => {
    if (!activeProject) return;
    const updatedDS = {
      ...activeProject.designSystem,
      variables: { ...activeProject.designSystem.variables, [varName]: newVal }
    };
    setActiveProject({ ...activeProject, designSystem: updatedDS });
  };

  const SidebarItem = ({ tab, icon, label }: { tab: SidebarTab, icon: string, label: string }) => {
    const isActive = activeTab === tab;
    const isDisabled = (tab === 'EDITOR' || tab === 'ASSETS' || tab === 'SETTINGS') && !activeProject;
    return (
      <button
        onClick={() => !isDisabled && setActiveTab(tab)}
        className={`group relative w-full aspect-square flex flex-col items-center justify-center transition-all duration-300 ${
          isActive ? 'text-white' : isDisabled ? 'text-zinc-800 cursor-not-allowed opacity-30' : 'text-zinc-500 hover:text-white'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 w-1 bg-indigo-500 h-1/2 rounded-r-full shadow-[0_0_15px_#6366f1]"></div>
        )}
        <i className={`fa-solid ${icon} text-lg mb-1.5 transition-transform group-hover:scale-110`}></i>
        <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{label}</span>
      </button>
    );
  };

  return (
    <div className="h-screen w-screen flex bg-[#050505] overflow-hidden text-zinc-300">
      <aside className="w-24 h-full glass-panel border-r border-white/5 flex flex-col items-center py-8 z-[60] shrink-0 shadow-2xl">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center text-white mb-12 shadow-[0_0_30px_rgba(99,102,241,0.3)] cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('HOME')}>
          <i className="fa-solid fa-cube text-3xl"></i>
        </div>
        <div className="flex-1 w-full space-y-2">
          <SidebarItem tab="HOME" icon="fa-house" label="Home" />
          <SidebarItem tab="EDITOR" icon="fa-layer-group" label="Editor" />
          <SidebarItem tab="ASSETS" icon="fa-photo-film" label="Assets" />
          <SidebarItem tab="SETTINGS" icon="fa-gear" label="Config" />
        </div>
        <div className="mt-auto">
           <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-600 text-xs font-bold">
              AI
           </div>
        </div>
      </aside>

      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500"></i>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nexus OS Loading</span>
          </div>
        </div>}>
          {activeTab === 'HOME' && (
            <DashboardView 
              projects={projects} 
              isLoading={isLoading} 
              syncStatus={syncStatus}
              onOpenProject={(p) => { setActiveProject(p); setActiveTab('EDITOR'); }} 
              onCreateNew={handleCreateNew} 
              onDeleteProject={(id, e) => { e.stopPropagation(); deleteProject(id); }}
            />
          )}
          {activeTab === 'EDITOR' && activeProject && (
            <EditorView 
              activeProject={activeProject}
              viewMode={viewMode}
              setViewMode={setViewMode}
              zoom={zoom}
              setZoom={setZoom}
              selectedElement={selectedElement}
              selectedId={selectedId}
              handleSelect={(el) => { setSelectedElement(el); setSelectedId(el.id); }}
              updateTrigger={updateTrigger}
              isAnalyzing={isAnalyzing}
              onSave={handleManualSave}
              onForceUpdate={handleForceUpdate}
              onVariableUpdate={handleVariableUpdate}
              onUpdateProject={setActiveProject}
              lastSaved={lastSaved}
            />
          )}
          {activeTab === 'ASSETS' && activeProject && (
            <AssetsView activeProject={activeProject} />
          )}
          {activeTab === 'SETTINGS' && activeProject && (
            <SettingsView 
              activeProject={activeProject} 
              onUpdateProject={setActiveProject}
              onDeleteProject={async (id) => {
                await deleteProject(id);
                setActiveProject(null);
                setActiveTab('HOME');
              }}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}
