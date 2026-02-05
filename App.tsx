
import React, { useState, useCallback, Suspense } from 'react';
import { usePersistence } from './hooks/usePersistence.ts';
import { DashboardView } from './views/DashboardView.tsx';
import { EditorView } from './views/EditorView.tsx';
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
  const { projects, isLoading, saveProject, deleteProject } = usePersistence();
  const [activeTab, setActiveTab] = useState<SidebarTab>('HOME');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Editor-specific State
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DESKTOP);
  const [zoom, setZoom] = useState(1);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const handleCreateNew = async (inputHtml: string) => {
    const { processedHtml, variables } = tokenizeHtmlColors(inputHtml);
    
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Site ${projects.length + 1}`,
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
      console.error("AI Analysis failed, project created anyway.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveActiveProject = async () => {
    if (!activeProject) return;
    const updated = { ...activeProject, lastUpdated: new Date().toISOString() };
    const res = await saveProject(updated);
    if (res.success) alert("Projeto salvo com sucesso!");
  };

  const handleForceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
    if (activeProject) {
        const canvasFrame = document.querySelector('iframe') as HTMLIFrameElement;
        if (canvasFrame && canvasFrame.contentDocument) {
            const docClone = canvasFrame.contentDocument.documentElement.cloneNode(true) as HTMLElement;
            docClone.querySelectorAll('.nexus-selected-outline, .nexus-hover-outline, .nexus-editing').forEach(el => {
                el.classList.remove('nexus-selected-outline', 'nexus-hover-outline', 'nexus-editing');
            });
            const cleanHtml = "<!DOCTYPE html>\n" + docClone.outerHTML;
            setActiveProject(prev => prev ? { ...prev, html: cleanHtml } : null);
        }
    }
  }, [activeProject]);

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
    const isDisabled = tab === 'EDITOR' && !activeProject;
    return (
      <button
        onClick={() => !isDisabled && setActiveTab(tab)}
        className={`group relative w-full aspect-square flex flex-col items-center justify-center transition-all duration-300 ${
          isActive ? 'text-white' : isDisabled ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-white'
        }`}
        title={label}
      >
        {isActive && <div className="absolute left-0 w-1.5 h-1/2 bg-indigo-500 rounded-r-full shadow-[0_0_20px_rgba(99,102,241,0.6)]"></div>}
        <div className={`p-3 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'group-hover:bg-white/5'}`}>
          <i className={`fa-solid ${icon} text-lg`}></i>
        </div>
        <span className="text-[9px] font-bold mt-1.5 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">{label}</span>
      </button>
    );
  };

  return (
    <div className="h-screen w-screen flex bg-[#050505] overflow-hidden">
      <aside className="w-24 h-full glass-panel border-r border-white/5 flex flex-col items-center py-8 z-[60] shrink-0">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-12 shadow-2xl shadow-indigo-600/40 animate-pulse cursor-pointer" onClick={() => setActiveTab('HOME')}>
          <i className="fa-solid fa-cube text-2xl"></i>
        </div>
        <div className="flex-1 w-full space-y-4">
          <SidebarItem tab="HOME" icon="fa-house" label="Home" />
          <SidebarItem tab="EDITOR" icon="fa-layer-group" label="Editor" />
          <SidebarItem tab="ASSETS" icon="fa-folder-open" label="Assets" />
        </div>
        <div className="w-full mt-auto">
          <SidebarItem tab="SETTINGS" icon="fa-gear" label="Config" />
        </div>
      </aside>

      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white">Carregando interface...</div>}>
          {activeTab === 'HOME' && (
            <DashboardView 
              projects={projects} 
              isLoading={isLoading} 
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
              onSave={saveActiveProject}
              onForceUpdate={handleForceUpdate}
              onVariableUpdate={handleVariableUpdate}
              onUpdateProject={setActiveProject}
            />
          )}
          {(activeTab === 'ASSETS' || activeTab === 'SETTINGS') && (
            <div className="flex-1 flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest bg-grid-tech">
              Em desenvolvimento profissional...
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
