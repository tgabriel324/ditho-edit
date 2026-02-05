import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tab, DesignSystem } from '../types';
import { aiRefactorElement } from '../services/geminiService';

interface PropertiesPanelProps {
  element: HTMLElement | null;
  designSystem: DesignSystem;
  onUpdate: () => void; 
  onUpdateVariable: (key: string, value: string) => void;
}

const InputGroup = ({ label, children }: { label: string, children?: React.ReactNode }) => (
  <div className="mb-4">
    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">{label}</label>
    {children}
  </div>
);

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ element, designSystem, onUpdate, onUpdateVariable }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PROJECT);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replacementInputRef = useRef<HTMLInputElement>(null);
  
  // Element State
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [textContent, setTextContent] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  
  // Link State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTargetNewTab, setLinkTargetNewTab] = useState(false);
  
  // Design System Edit State
  const [editingColor, setEditingColor] = useState<string | null>(null);

  // --- SMART DETECTION: LOGO CANDIDATE ---
  // Detects if the selected element is likely a text logo that the user wants to swap
  const isLogoCandidate = useMemo(() => {
     if (!element || element.tagName === 'IMG' || element.tagName === 'BODY' || element.tagName === 'HTML') return false;
     
     const tag = element.tagName;
     const text = element.innerText?.trim() || '';
     const className = element.className.toLowerCase();
     
     // Criteria 1: It's an H1-H6, SPAN, or DIV with very short text (typical for text logos)
     const isTitleTag = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'STRONG', 'B', 'DIV', 'A', 'SVG'].includes(tag);
     const isShortText = text.length > 0 && text.length < 30;
     
     // Criteria 2: Explicit naming
     const hasBrandName = className.includes('logo') || className.includes('brand') || element.id.includes('logo');
     
     // Criteria 3: Context (Inside a Header)
     const insideHeader = element.closest('header') !== null || element.closest('.header') !== null || element.closest('.navbar') !== null;
     
     return (isTitleTag && isShortText && insideHeader) || (hasBrandName && tag !== 'NAV');
  }, [element]);

  // Sync with selected element
  useEffect(() => {
    if (element) {
      setActiveTab(Tab.STYLE); // Switch to style when element selected
      const computed = element.ownerDocument.defaultView?.getComputedStyle(element);
      if (!computed) return;

      const rgbToHex = (rgb: string) => {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return 'transparent';
        if (rgb.startsWith('#')) return rgb;
        if (rgb.startsWith('rgba')) {
           const parts = rgb.match(/[\d.]+/g);
           if(!parts || parts.length < 3) return '#000000';
           const r = parseInt(parts[0]).toString(16).padStart(2,'0');
           const g = parseInt(parts[1]).toString(16).padStart(2,'0');
           const b = parseInt(parts[2]).toString(16).padStart(2,'0');
           return `#${r}${g}${b}`;
        }
        if (rgb.startsWith('rgb')) {
            const sep = rgb.indexOf(",") > -1 ? "," : " ";
            const parts = rgb.substr(4).split(")")[0].split(sep);
            const r = (+parts[0]).toString(16).padStart(2, "0");
            const g = (+parts[1]).toString(16).padStart(2, "0");
            const b = (+parts[2]).toString(16).padStart(2, "0");
            return `#${r}${g}${b}`;
        }
        return rgb;
      };

      setStyles({
        color: rgbToHex(computed.color),
        backgroundColor: rgbToHex(computed.backgroundColor),
        fontSize: computed.fontSize,
        padding: element.style.padding || computed.padding,
        margin: element.style.margin || computed.margin,
        borderRadius: element.style.borderRadius || computed.borderRadius,
        borderWidth: element.style.borderWidth || computed.borderWidth,
        textAlign: computed.textAlign,
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap,
        width: computed.width,
        height: computed.height,
        objectFit: computed.objectFit,
      });

      // Image Sync
      if (element.tagName === 'IMG') {
        setImgSrc((element as HTMLImageElement).src);
      }
      
      // Text Sync
      setTextContent(element.innerText);

      // Link Sync
      if (element.tagName === 'A') {
          setLinkUrl(element.getAttribute('href') || '');
          setLinkTargetNewTab(element.getAttribute('target') === '_blank');
      } else {
          // Check for JS redirect onclick
          const onclick = element.getAttribute('onclick') || '';
          const urlMatch = onclick.match(/window\.open\('([^']+)'/);
          const locationMatch = onclick.match(/location\.href='([^']+)'/);
          
          if (urlMatch) {
              setLinkUrl(urlMatch[1]);
              setLinkTargetNewTab(onclick.includes('_blank'));
          } else if (locationMatch) {
              setLinkUrl(locationMatch[1]);
              setLinkTargetNewTab(false);
          } else {
              setLinkUrl('');
              setLinkTargetNewTab(false);
          }
      }

    } else {
      setActiveTab(Tab.PROJECT);
    }
  }, [element]);

  const handleStyleChange = (key: string, value: string) => {
    if (!element) return;
    setStyles(prev => ({ ...prev, [key]: value }));
    // @ts-ignore
    element.style[key] = value;
    onUpdate();
  };

  const handleTextChange = (value: string) => {
    if (!element) return;
    setTextContent(value);
    element.innerText = value;
    onUpdate();
  };

  const handleLinkChange = (url: string) => {
      if (!element) return;
      setLinkUrl(url);
      applyLink(url, linkTargetNewTab);
  };

  const handleLinkTargetChange = (newTab: boolean) => {
      if (!element) return;
      setLinkTargetNewTab(newTab);
      applyLink(linkUrl, newTab);
  };

  const applyLink = (url: string, newTab: boolean) => {
      if (!element) return;
      
      if (element.tagName === 'A') {
          if (url) {
            element.setAttribute('href', url);
            if (newTab) element.setAttribute('target', '_blank');
            else element.removeAttribute('target');
          } else {
            element.removeAttribute('href');
            element.removeAttribute('target');
          }
      } else {
          // For buttons or divs, use onclick
          if (url) {
              element.style.cursor = 'pointer';
              if (newTab) {
                  element.setAttribute('onclick', `window.open('${url}', '_blank')`);
              } else {
                  element.setAttribute('onclick', `window.location.href='${url}'`);
              }
          } else {
              element.style.cursor = '';
              element.removeAttribute('onclick');
          }
      }
      onUpdate();
  };

  const handleImgSrcChange = (value: string) => {
    if (!element || element.tagName !== 'IMG') return;
    setImgSrc(value);
    (element as HTMLImageElement).src = value;
    onUpdate();
  };

  // --- SURGICAL REPLACEMENT: TEXT -> IMAGE ---
  const handleReplaceWithImage = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !element || !element.parentNode) return;

     const reader = new FileReader();
     reader.onload = (event) => {
         const base64 = event.target?.result as string;
         const doc = element.ownerDocument;
         
         // 1. Create the new prosthesis (Image)
         const newImg = doc.createElement('img');
         newImg.src = base64;
         newImg.alt = "Logo";
         
         // 2. Apply Safety Locks (Prevent explosion)
         newImg.style.maxHeight = '40px'; // Safe default for logos
         newImg.style.width = 'auto';
         newImg.style.display = 'block';
         
         // 3. Clone crucial attributes
         if(element.id && !element.id.startsWith('nx-')) newImg.id = element.id;
         newImg.className = element.className; // Maintain positioning classes

         // 4. Perform the Transplant
         // We insert BEFORE the old element, then remove the old one.
         // This keeps the position in the DOM tree exactly where it was.
         element.parentNode?.insertBefore(newImg, element);
         element.parentNode?.removeChild(element);

         // 5. Update State
         onUpdate();
         // Since the original element is gone, we technically lose selection, 
         // but the user sees the image appear instantly.
     };
     reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleImgSrcChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const triggerReplacementUpload = () => {
    replacementInputRef.current?.click();
  };

  const handleDuplicate = () => {
      if (!element || !element.parentNode || element.tagName === 'BODY' || element.tagName === 'HTML') return;
      
      // Clone the node deeply
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Helper to generate new IDs for the clone and its children
      // ensuring unique IDs in the DOM
      const regenerateIds = (el: HTMLElement) => {
          el.id = `nx-clone-${Math.random().toString(36).substr(2, 6)}`;
          // Clear any "selected" class from the clone
          el.classList.remove('nexus-selected-outline');
          el.classList.remove('nexus-hover-outline');
          
          Array.from(el.children).forEach(child => regenerateIds(child as HTMLElement));
      };
      
      regenerateIds(clone);
      
      // Insert after the current element
      element.parentNode.insertBefore(clone, element.nextSibling);
      
      // Trigger update to refresh view
      onUpdate();
  };

  const handleAiAction = async () => {
    if (!element || !aiPrompt.trim()) return;
    setIsAiProcessing(true);
    try {
      const outerHtml = element.outerHTML;
      const newHtml = await aiRefactorElement(outerHtml, aiPrompt);
      element.outerHTML = newHtml;
      onUpdate();
      setAiPrompt('');
    } catch (e) {
      console.error(e);
      alert('AI Action Failed');
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="glass-panel w-96 h-full border-l border-white/10 flex flex-col z-20 shadow-2xl backdrop-blur-3xl bg-[#09090b]/90">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             {element ? (
               <>
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                   <i className={`text-white text-lg fa-solid ${element.tagName === 'IMG' ? 'fa-image' : 'fa-layer-group'}`}></i>
                 </div>
                 <div>
                   <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Editing</div>
                   <div className="text-sm text-white font-bold">{element.tagName}</div>
                 </div>
               </>
             ) : (
               <>
                 <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/5">
                   <i className="fa-solid fa-sliders text-zinc-400"></i>
                 </div>
                 <div>
                   <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Global</div>
                   <div className="text-sm text-white font-bold">Project Settings</div>
                 </div>
               </>
             )}
           </div>

           {/* ACTIONS (Duplicate/Delete) */}
           {element && element.tagName !== 'BODY' && (
              <div className="flex gap-2">
                 <button 
                   onClick={handleDuplicate}
                   className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                   title="Duplicate Element"
                 >
                   <i className="fa-solid fa-copy"></i>
                 </button>
                 <button 
                   onClick={() => { if(element.parentNode) { element.parentNode.removeChild(element); onUpdate(); } }}
                   className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-500 transition-all"
                   title="Delete Element"
                 >
                   <i className="fa-solid fa-trash"></i>
                 </button>
              </div>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-2 border-b border-white/5 bg-black/40">
        <div className="flex bg-white/5 rounded-lg p-1">
          {[Tab.PROJECT, Tab.STYLE, Tab.CONTENT, Tab.AI].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 text-[9px] font-bold tracking-widest rounded-md transition-all ${
                activeTab === t 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        
        {/* === PROJECT TAB (Global Design System) === */}
        {activeTab === Tab.PROJECT && (
          <div className="animate-fadeIn space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-palette text-indigo-400"></i> Global Variables
              </h3>
              <p className="text-[9px] text-zinc-500 mb-4">
                 Our engine extracted these colors. Change them here to update the entire site instantly.
              </p>
              
              <div className="space-y-2">
                {Object.entries(designSystem.variables).map(([varName, colorValue], idx) => (
                  <div key={varName} className="group relative bg-white/5 border border-white/5 rounded-lg p-2 flex items-center gap-3 hover:bg-white/10 transition-colors">
                     <div className="relative">
                        <input 
                           type="color" 
                           value={colorValue}
                           onChange={(e) => onUpdateVariable(varName, e.target.value)}
                           className="w-8 h-8 opacity-0 absolute inset-0 cursor-pointer z-10"
                        />
                        <div className="w-8 h-8 rounded-full shadow-inner border border-white/10" style={{backgroundColor: colorValue}}></div>
                     </div>
                     <div className="flex-1">
                        <div className="text-[10px] text-zinc-500 font-mono">{varName}</div>
                        <div className="text-[10px] text-zinc-300 font-mono">{colorValue}</div>
                     </div>
                     <div className="text-[9px] text-zinc-600 group-hover:text-indigo-400">Edit</div>
                  </div>
                ))}
                {Object.keys(designSystem.variables).length === 0 && (
                   <div className="text-xs text-zinc-500 italic p-2 border border-dashed border-zinc-800 rounded">
                      No colors detected for variables.
                   </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-font text-indigo-400"></i> Typography
              </h3>
              <div className="space-y-2">
                 {designSystem.fonts.map((font, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between">
                       <span style={{fontFamily: font}} className="text-sm text-zinc-200">{font}</span>
                       <span className="text-[10px] text-zinc-500 bg-black/30 px-2 py-1 rounded">Used in Body</span>
                    </div>
                 ))}
                 {designSystem.fonts.length === 0 && <div className="text-xs text-zinc-600">No fonts detected.</div>}
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl border border-indigo-500/20">
               <h3 className="text-xs font-bold text-indigo-300 mb-2">Global Refactor</h3>
               <p className="text-[10px] text-zinc-400 mb-3">Ask AI to change the entire look and feel.</p>
               <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors">
                 Open Global AI Agent
               </button>
            </div>
          </div>
        )}

        {/* === STYLE TAB === */}
        {activeTab === Tab.STYLE && (
          <div className="animate-fadeIn space-y-6">
            {!element ? (
              <div className="text-center text-zinc-500 py-10">Select an element to style</div>
            ) : (
              <>
                 {/* === BRANDING / SMART REPLACEMENT SECTION === */}
                 {isLogoCandidate && (
                   <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 relative overflow-hidden animate-float-in">
                       <div className="absolute inset-0 bg-grid-tech opacity-10"></div>
                       <div className="relative z-10 flex flex-col gap-3">
                          <div className="flex items-center gap-2 mb-1">
                             <i className="fa-solid fa-crown text-amber-500 text-xs"></i>
                             <h4 className="text-[10px] font-bold text-amber-500 uppercase">Smart Branding</h4>
                          </div>
                          <p className="text-[9px] text-zinc-400 leading-relaxed">
                            Detected potential logo text. Want to switch to an image safely?
                          </p>
                          <input 
                             type="file" 
                             ref={replacementInputRef}
                             onChange={handleReplaceWithImage}
                             className="hidden"
                             accept="image/*"
                          />
                          <button 
                            onClick={triggerReplacementUpload}
                            className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 rounded text-xs font-bold uppercase transition-all"
                          >
                            <i className="fa-regular fa-image mr-2"></i> Replace with Image Logo
                          </button>
                       </div>
                   </div>
                 )}

                 {/* LINK / ACTION MANAGER */}
                 <div className="p-4 bg-gradient-to-br from-emerald-900/10 to-teal-900/10 rounded-xl border border-emerald-500/20 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-grid-tech opacity-10"></div>
                     <h4 className="text-[10px] font-bold text-emerald-400 uppercase mb-3 relative z-10 flex items-center gap-2">
                        <i className="fa-solid fa-link"></i> Action / Link
                     </h4>
                     <div className="relative z-10 space-y-3">
                         <div>
                            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-2 focus-within:border-emerald-500 transition-colors">
                               <i className="fa-solid fa-globe text-zinc-500 text-xs"></i>
                               <input 
                                  type="text" 
                                  value={linkUrl}
                                  onChange={(e) => handleLinkChange(e.target.value)}
                                  placeholder="https://..." 
                                  className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-zinc-600"
                               />
                            </div>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Open in new tab</span>
                            <button 
                              onClick={() => handleLinkTargetChange(!linkTargetNewTab)}
                              className={`w-10 h-5 rounded-full relative transition-colors ${linkTargetNewTab ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                            >
                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${linkTargetNewTab ? 'left-6' : 'left-1'}`}></div>
                            </button>
                         </div>
                         {element.tagName !== 'A' && linkUrl && (
                             <div className="text-[9px] text-emerald-500/80 italic flex items-center gap-1">
                                <i className="fa-solid fa-bolt"></i> Click action enabled
                             </div>
                         )}
                     </div>
                 </div>

                 {/* MEDIA MANAGER FOR IMAGES */}
                 {element.tagName === 'IMG' && (
                    <div className="space-y-4 animate-fadeIn">
                       <div className="p-4 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-xl border border-indigo-500/20 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-grid-tech opacity-10"></div>
                           <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-3 relative z-10">Media Asset</h4>
                           
                           {/* Preview & Action */}
                           <div className="flex gap-4 mb-4 relative z-10">
                              <div className="w-16 h-16 rounded-lg bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center">
                                 <img src={imgSrc} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 flex flex-col justify-center gap-2">
                                 <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    className="hidden" 
                                    accept="image/*"
                                 />
                                 <button 
                                    onClick={triggerFileUpload}
                                    className="w-full py-1.5 bg-white text-black text-[10px] font-bold uppercase rounded hover:bg-zinc-200 transition-colors"
                                 >
                                    <i className="fa-solid fa-upload mr-1"></i> Upload New
                                 </button>
                                 <div className="text-[9px] text-zinc-500 text-center">Supports JPG, PNG, GIF, SVG</div>
                              </div>
                           </div>

                           {/* Presets */}
                           <div className="relative z-10">
                              <label className="text-[9px] text-zinc-500 mb-2 block">Quick Replace (Demo)</label>
                              <div className="grid grid-cols-4 gap-2">
                                 {['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200',
                                   'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200', 
                                   'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200',
                                   'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200'
                                  ].map((src, i) => (
                                    <button 
                                      key={i}
                                      onClick={() => handleImgSrcChange(src)}
                                      className="aspect-square rounded border border-white/10 overflow-hidden hover:border-indigo-400 transition-colors"
                                    >
                                       <img src={src} className="w-full h-full object-cover opacity-70 hover:opacity-100" />
                                    </button>
                                  ))}
                              </div>
                           </div>
                       </div>

                       {/* Object Fit Controls */}
                       <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                           <InputGroup label="Image Fit">
                              <div className="flex bg-black/20 rounded p-1 gap-1">
                                 {['cover', 'contain', 'fill'].map((fit) => (
                                    <button
                                       key={fit}
                                       onClick={() => handleStyleChange('objectFit', fit)}
                                       className={`flex-1 py-1.5 rounded text-[10px] capitalize transition-colors ${
                                          styles.objectFit === fit ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'
                                       }`}
                                       title={`Object Fit: ${fit}`}
                                    >
                                       {fit === 'cover' && <i className="fa-solid fa-expand"></i>}
                                       {fit === 'contain' && <i className="fa-solid fa-compress"></i>}
                                       {fit === 'fill' && <i className="fa-solid fa-maximize"></i>}
                                    </button>
                                 ))}
                              </div>
                           </InputGroup>
                           <div className="grid grid-cols-2 gap-3">
                              <InputGroup label="Width">
                                 <input type="text" value={styles.width} onChange={(e) => handleStyleChange('width', e.target.value)} className="input-premium w-full rounded p-2 text-xs" />
                              </InputGroup>
                              <InputGroup label="Height">
                                 <input type="text" value={styles.height} onChange={(e) => handleStyleChange('height', e.target.value)} className="input-premium w-full rounded p-2 text-xs" />
                              </InputGroup>
                           </div>
                       </div>
                    </div>
                 )}

                 {/* Standard Styles (Available for all, but maybe simplified for images) */}
                 <div className="space-y-6">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                       <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-4 border-b border-white/5 pb-2">Layout & Position</h4>
                       <div className="grid grid-cols-2 gap-3 mb-3">
                          <InputGroup label="Display">
                             <select value={styles.display} onChange={(e) => handleStyleChange('display', e.target.value)} className="input-premium w-full rounded p-2 text-xs">
                                <option value="block">Block</option>
                                <option value="flex">Flex</option>
                                <option value="grid">Grid</option>
                                <option value="inline-block">Inline</option>
                             </select>
                          </InputGroup>
                          {styles.display === 'flex' && (
                             <InputGroup label="Direction">
                                <select value={styles.flexDirection} onChange={(e) => handleStyleChange('flexDirection', e.target.value)} className="input-premium w-full rounded p-2 text-xs">
                                   <option value="row">Row (→)</option>
                                   <option value="column">Col (↓)</option>
                                </select>
                             </InputGroup>
                          )}
                       </div>
                       <InputGroup label="Padding / Margin">
                          <div className="grid grid-cols-2 gap-2">
                             <input placeholder="Pad" value={styles.padding} onChange={(e) => handleStyleChange('padding', e.target.value)} className="input-premium w-full rounded p-2 text-xs font-mono" />
                             <input placeholder="Mar" value={styles.margin} onChange={(e) => handleStyleChange('margin', e.target.value)} className="input-premium w-full rounded p-2 text-xs font-mono" />
                          </div>
                       </InputGroup>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-4 border-b border-white/5 pb-2">Appearance</h4>
                        <InputGroup label="Colors">
                           <div className="flex gap-3">
                              <div className="flex-1">
                                 <label className="text-[9px] text-zinc-500 mb-1 block">Text</label>
                                 <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded border border-white/10">
                                    <input type="color" value={styles.color === 'transparent' ? '#ffffff' : styles.color} onChange={(e) => handleStyleChange('color', e.target.value)} className="w-5 h-5 bg-transparent border-none rounded cursor-pointer" />
                                    <span className="text-[10px] font-mono text-zinc-300">{styles.color}</span>
                                 </div>
                              </div>
                              <div className="flex-1">
                                 <label className="text-[9px] text-zinc-500 mb-1 block">Background</label>
                                 <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded border border-white/10">
                                    <input type="color" value={styles.backgroundColor === 'transparent' ? '#ffffff' : styles.backgroundColor} onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} className="w-5 h-5 bg-transparent border-none rounded cursor-pointer" />
                                    <span className="text-[10px] font-mono text-zinc-300">{styles.backgroundColor}</span>
                                 </div>
                              </div>
                           </div>
                        </InputGroup>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                           <InputGroup label="Font Size">
                              <input value={styles.fontSize} onChange={(e) => handleStyleChange('fontSize', e.target.value)} className="input-premium w-full rounded p-2 text-xs font-mono" />
                           </InputGroup>
                           <InputGroup label="Radius">
                              <input value={styles.borderRadius} onChange={(e) => handleStyleChange('borderRadius', e.target.value)} className="input-premium w-full rounded p-2 text-xs font-mono" />
                           </InputGroup>
                        </div>
                    </div>
                 </div>
              </>
            )}
          </div>
        )}

        {/* === CONTENT TAB === */}
        {activeTab === Tab.CONTENT && (
          <div className="animate-fadeIn">
            {!element ? <div className="text-zinc-500 text-center mt-10">No element selected</div> : (
               <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                     <label className="text-xs font-bold text-zinc-300 mb-2 block">Inner Text / HTML</label>
                     <textarea 
                        value={textContent}
                        onChange={(e) => handleTextChange(e.target.value)}
                        className="input-premium w-full h-80 rounded-lg p-3 text-xs font-mono leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500/50"
                        spellCheck={false}
                     />
                  </div>
               </div>
            )}
          </div>
        )}

        {/* === AI TAB === */}
        {activeTab === Tab.AI && (
          <div className="animate-fadeIn">
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-[#09090b] rounded-xl border border-white/10 p-5">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                         <i className="fa-solid fa-sparkles text-indigo-400"></i>
                      </div>
                      <h3 className="text-sm font-bold text-white">Gemini Architect</h3>
                   </div>
                   
                   <textarea 
                     value={aiPrompt}
                     onChange={(e) => setAiPrompt(e.target.value)}
                     placeholder={element ? `How should we change this ${element.tagName}?` : "Select an element first..."}
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white h-32 mb-4 focus:border-indigo-500 outline-none resize-none placeholder-zinc-600"
                   />
                   
                   <button 
                     onClick={handleAiAction}
                     disabled={isAiProcessing || !element}
                     className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                       isAiProcessing 
                         ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                         : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                     }`}
                   >
                     {isAiProcessing ? (
                       <><i className="fa-solid fa-spinner fa-spin"></i> Processing</>
                     ) : (
                       <>Execute Changes <i className="fa-solid fa-bolt"></i></>
                     )}
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};