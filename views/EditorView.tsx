
import React from 'react';
import { VisualCanvas } from '../components/VisualCanvas';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { Project, ViewMode } from '../types';

interface EditorViewProps {
  activeProject: Project;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  zoom: number;
  setZoom: (z: number) => void;
  selectedElement: HTMLElement | null;
  selectedId: string | null;
  handleSelect: (el: HTMLElement) => void;
  updateTrigger: number;
  isAnalyzing: boolean;
  onSave: () => void;
  onUpdateProject: (updated: Project) => void;
  onForceUpdate: () => void;
  onVariableUpdate: (varName: string, newVal: string) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  activeProject, viewMode, setViewMode, zoom, setZoom,
  selectedElement, selectedId, handleSelect, updateTrigger,
  isAnalyzing, onSave, onForceUpdate, onVariableUpdate
}) => {
  return (
    <div className="flex-1 flex flex-col h-full animate-fadeIn">
      <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-10 shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 border border-white/5">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Projeto Ativo</div>
              <div className="text-sm font-bold text-white tracking-tight">{activeProject.name}</div>
            </div>
          </div>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
             {[
               { mode: ViewMode.DESKTOP, icon: 'fa-desktop' },
               { mode: ViewMode.TABLET, icon: 'fa-tablet-screen-button' },
               { mode: ViewMode.MOBILE, icon: 'fa-mobile-screen' }
             ].map((device) => (
                <button
                  key={device.mode}
                  onClick={() => setViewMode(device.mode)}
                  className={`w-11 h-10 rounded-lg flex items-center justify-center transition-all ${
                    viewMode === device.mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <i className={`fa-solid ${device.icon} text-sm`}></i>
                </button>
             ))}
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 bg-black/30 px-5 py-2.5 rounded-xl border border-white/5">
             <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
             <input type="range" min="0.5" max="1.5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-28 accent-indigo-500" />
             <span className="text-white font-bold">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {isAnalyzing && (
              <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-pulse">
                 <i className="fa-solid fa-sparkles text-indigo-400 text-xs"></i>
                 <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">AI Syncing...</span>
              </div>
           )}
           <button onClick={onSave} className="px-6 py-3 bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all active:scale-95">Salvar</button>
           <button className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95">Publicar</button>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-[#050505] relative flex flex-col items-center no-scrollbar">
           <VisualCanvas 
            initialHtml={activeProject.html} 
            cssVariables={activeProject.designSystem.variables}
            onSelectElement={handleSelect}
            selectedId={selectedId}
            triggerUpdate={updateTrigger}
            viewMode={viewMode}
            zoom={zoom}
          />
        </div>
        <PropertiesPanel 
          element={selectedElement} 
          designSystem={activeProject.designSystem}
          onUpdate={onForceUpdate}
          onUpdateVariable={onVariableUpdate}
        />
      </div>
    </div>
  );
};
