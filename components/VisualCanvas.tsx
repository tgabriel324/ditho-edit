import React, { useEffect, useRef, useState } from 'react';
import { ViewMode } from '../types';

interface VisualCanvasProps {
  initialHtml: string;
  cssVariables?: Record<string, string>; // New prop for dynamic variables
  onSelectElement: (element: HTMLElement) => void;
  selectedId: string | null;
  triggerUpdate: number;
  viewMode: ViewMode;
  zoom: number;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({ 
  initialHtml, 
  cssVariables = {},
  onSelectElement, 
  selectedId, 
  triggerUpdate,
  viewMode,
  zoom
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Helper to inject styles into the iframe
  const injectEditorStyles = (doc: Document) => {
    const styleId = 'nexus-editor-styles';
    if (!doc.getElementById(styleId)) {
      const style = doc.createElement('style');
      style.id = styleId;
      style.textContent = `
        .nexus-hover-outline {
          outline: 2px dashed #6366f1 !important;
          outline-offset: -2px;
          cursor: pointer;
        }
        .nexus-selected-outline {
          outline: 2px solid #a855f7 !important;
          outline-offset: -2px;
          position: relative;
          z-index: 1000;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
        }
        /* Editing State */
        .nexus-editing {
          outline: 2px solid #22c55e !important; /* Green for editing */
          outline-offset: -2px;
          background-color: rgba(34, 197, 94, 0.1);
          cursor: text !important;
          min-width: 10px;
        }
        /* Tag label on hover */
        .nexus-hover-outline::after {
          content: attr(data-tagname);
          position: absolute;
          top: -20px;
          left: 0;
          background: #6366f1;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: sans-serif;
          z-index: 1001;
          pointer-events: none;
          text-transform: uppercase;
          font-weight: bold;
        }
        /* Hide hover label when editing or selected */
        .nexus-editing::after, .nexus-selected-outline::after {
          display: none !important;
        }
        
        body {
            transition: none !important; /* Prevent resize jitters */
            min-height: 100vh;
        }
        /* Scrollbar inside iframe */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
      `;
      doc.head.appendChild(style);
    }
  };

  // Inject CSS Variables dynamically
  const injectCssVariables = (doc: Document, vars: Record<string, string>) => {
    const styleId = 'nexus-global-vars';
    let style = doc.getElementById(styleId);
    if (!style) {
      style = doc.createElement('style');
      style.id = styleId;
      doc.head.appendChild(style);
    }

    const cssString = Object.entries(vars)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');
    
    style.textContent = `:root {\n${cssString}\n}`;
  };

  // Initial Load & Iframe Content Injection
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(initialHtml);
      doc.close();
      
      const loadHandler = () => setIframeLoaded(true);
      iframe.onload = loadHandler;
      
      if (doc.readyState === 'complete') {
        setIframeLoaded(true);
      }
    }
  }, [initialHtml]);

  // React to Variable Changes (Instant Update)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeLoaded || !iframe.contentDocument) return;
    injectCssVariables(iframe.contentDocument, cssVariables);
  }, [cssVariables, iframeLoaded]);

  // Event Listeners inside Iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeLoaded || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;
    injectEditorStyles(doc);

    let hoveredEl: HTMLElement | null = null;

    // --- HOVER EFFECT ---
    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === doc.body || target === doc.documentElement) return;
      if (target.isContentEditable) return; // Don't hover effects while editing
      
      e.stopPropagation();
      
      if (hoveredEl && hoveredEl !== target) {
        hoveredEl.classList.remove('nexus-hover-outline');
      }
      target.classList.add('nexus-hover-outline');
      target.setAttribute('data-tagname', target.tagName.toLowerCase());
      hoveredEl = target;
    };

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement;
      target.classList.remove('nexus-hover-outline');
    };

    // --- SELECTION (Single Click) ---
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Allow default behavior if editing (so we can move cursor)
      if (target.isContentEditable) {
        e.stopPropagation();
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      if (target === doc.body || target === doc.documentElement) return;

      const prev = doc.querySelector('.nexus-selected-outline');
      if (prev) prev.classList.remove('nexus-selected-outline');

      if (!target.id) {
        target.id = `nx-${Math.random().toString(36).substr(2, 6)}`;
      }

      target.classList.add('nexus-selected-outline');
      onSelectElement(target);
    };

    // --- INLINE EDITING (Double Click) ---
    const handleDblClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // IMAGES: Prevent editing text on images
      if (target.tagName === 'IMG') {
          e.preventDefault();
          e.stopPropagation();
          // We just ensure it's selected, but don't add contentEditable
          return;
      }

      const editableTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'BUTTON', 'A', 'LI', 'BLOCKQUOTE', 'TH', 'TD', 'STRONG', 'EM', 'B', 'I'];
      
      // Only allow editing text-based elements
      if (editableTags.includes(target.tagName)) {
        e.preventDefault();
        e.stopPropagation();
        
        // Clean up UI states
        target.classList.remove('nexus-hover-outline');
        target.classList.remove('nexus-selected-outline');
        
        // Enable Editing
        target.contentEditable = 'true';
        target.classList.add('nexus-editing');
        target.focus();
      }
    };

    // --- SAVE ON BLUR ---
    const handleBlur = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.getAttribute('contenteditable') === 'true') {
            target.contentEditable = 'false';
            target.classList.remove('nexus-editing');
            target.classList.add('nexus-selected-outline');
            onSelectElement(target); 
        }
    };

    // --- KEYBOARD SHORTCUTS ---
    const handleKeyDown = (e: KeyboardEvent) => {
        if(e.key === 'Escape') {
            const target = e.target as HTMLElement;
            if (target.isContentEditable) {
                target.blur(); 
            }
        }
    };

    doc.addEventListener('mouseover', handleMouseOver);
    doc.addEventListener('mouseout', handleMouseOut);
    doc.addEventListener('click', handleClick);
    doc.addEventListener('dblclick', handleDblClick);
    doc.addEventListener('focusout', handleBlur); 
    doc.addEventListener('keydown', handleKeyDown);

    return () => {
      doc.removeEventListener('mouseover', handleMouseOver);
      doc.removeEventListener('mouseout', handleMouseOut);
      doc.removeEventListener('click', handleClick);
      doc.removeEventListener('dblclick', handleDblClick);
      doc.removeEventListener('focusout', handleBlur);
      doc.removeEventListener('keydown', handleKeyDown);
    };
  }, [iframeLoaded, onSelectElement]);

  // Sync Selection from Parent
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;
    const doc = iframe.contentDocument;

    if (doc.activeElement && doc.activeElement.getAttribute('contenteditable') === 'true') {
        return;
    }

    const allSelected = doc.querySelectorAll('.nexus-selected-outline');
    allSelected.forEach(el => el.classList.remove('nexus-selected-outline'));

    if (selectedId) {
      const el = doc.getElementById(selectedId);
      if (el) {
        el.classList.add('nexus-selected-outline');
      }
    }
  }, [selectedId, triggerUpdate]);

  return (
    <div className="flex justify-center items-start pt-12 pb-32 min-h-full">
      <div 
        className="transition-all duration-300 ease-out bg-white shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden relative"
        style={{ 
          width: viewMode, 
          height: viewMode === ViewMode.MOBILE ? '812px' : (viewMode === ViewMode.TABLET ? '1024px' : '900px'),
          minWidth: viewMode, // Enforce width
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Fake Browser Header */}
        <div className="h-9 bg-[#1a1a1a] border-b border-[#333] flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-[#2a2a2a] rounded text-[#666] text-[10px] px-3 py-1 w-2/3 text-center font-mono flex items-center justify-center gap-2">
              <i className="fa-solid fa-lock text-[8px]"></i> client-site-preview.com
            </div>
          </div>
        </div>

        {/* The Isolated Engine */}
        <iframe 
          ref={iframeRef}
          className="w-full h-[calc(100%-36px)] bg-white"
          title="Nexus Canvas"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
};