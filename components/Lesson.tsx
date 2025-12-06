import React, { useState, useEffect } from 'react';
import { LessonData, Organism } from '../types';
import * as GeminiService from '../services/gemini';

interface LessonProps {
  onClose: () => void;
}

const KINGDOMS = [
  "Archaebacteria",
  "Eubacteria",
  "Protista",
  "Fungi",
  "Plantae",
  "Animalia"
];

const Lesson: React.FC<LessonProps> = ({ onClose }) => {
  const [activeKingdom, setActiveKingdom] = useState<string>(KINGDOMS[0]);
  // Store organisms by kingdom to build a collection
  const [collections, setCollections] = useState<Record<string, Organism[]>>({});
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Only fetch if we haven't already fetched this kingdom
    if (!collections[activeKingdom]) {
      fetchKingdomData(activeKingdom);
    }
  }, [activeKingdom]);

  const fetchKingdomData = async (kingdom: string) => {
    setLoading(true);
    try {
      const data = await GeminiService.generateKingdomOrganisms(kingdom);
      setCollections(prev => ({
        ...prev,
        [kingdom]: data.organisms
      }));
    } catch (error) {
      console.error("Failed to fetch lesson", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (organismName: string, prompt: string) => {
    if (generatedImages[organismName] || loadingImages[organismName]) return;

    setLoadingImages(prev => ({ ...prev, [organismName]: true }));
    try {
      const imageUrl = await GeminiService.generateDiagram(prompt);
      setGeneratedImages(prev => ({ ...prev, [organismName]: imageUrl }));
    } catch (error) {
      console.error("Failed to generate image", error);
    } finally {
      setLoadingImages(prev => ({ ...prev, [organismName]: false }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentOrganisms = collections[activeKingdom] || [];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header (Hidden on Print) */}
      <div className="flex-none bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kingdoms Explorer</h2>
          <p className="text-xs text-slate-500">Explore and collect organisms for your guide</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF Guide
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Navigation (Hidden on Print) */}
      <div className="flex-none bg-white border-b border-slate-200 overflow-x-auto scrollbar-hide print:hidden">
        <div className="flex px-4 py-2 gap-2 min-w-max">
          {KINGDOMS.map(kingdom => (
            <button
              key={kingdom}
              onClick={() => setActiveKingdom(kingdom)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeKingdom === kingdom
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {kingdom} {collections[kingdom] ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 scrollbar-hide print:p-0 print:overflow-visible">
        
        {/* Title Page (Print Only) */}
        <div className="hidden print:flex flex-col justify-center items-center h-screen text-center break-after-page">
          <div className="w-24 h-24 mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-6xl">🧬</span>
          </div>
          <h1 className="text-5xl font-serif font-bold text-slate-900 mb-6 tracking-tight">Selected Organisms</h1>
          <h2 className="text-3xl text-slate-600 font-light mb-12">Illustrated Biology Guide</h2>
          <div className="w-48 h-1 bg-emerald-600 mb-16 mx-auto"></div>
          <div className="text-left max-w-md mx-auto">
             <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Included Kingdoms:</h3>
             <ul className="grid grid-cols-2 gap-2 text-slate-800 font-medium">
               {Object.keys(collections).map(k => <li key={k}>• {k}</li>)}
             </ul>
          </div>
          <p className="text-sm text-slate-400 mt-auto pb-12">Generated by BioBuddy</p>
        </div>

        {/* 
          We loop through ALL kingdoms.
          - On Screen: Only show the `activeKingdom` data.
          - On Print: Show ALL kingdoms that have data.
        */}
        {KINGDOMS.map(kingdom => {
          const organisms = collections[kingdom];
          const isVisible = activeKingdom === kingdom;

          // If no data for this kingdom, don't render anything (even for print)
          if (!organisms) return null;

          return (
            <div key={kingdom} className={`${isVisible ? 'block' : 'hidden print:block'}`}>
              
              {/* Screen-only loading state for active kingdom */}
              {loading && isVisible && !organisms.length && (
                <div className="flex flex-col items-center justify-center h-64 space-y-4 print:hidden">
                  <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  <p className="text-emerald-800 font-medium">Researching {kingdom}...</p>
                </div>
              )}

              {/* Grid for screen, block for print */}
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 print:block print:w-full print:max-w-none">
                {organisms.map((org, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full break-inside-avoid print:shadow-none print:border-none print:h-screen print:break-after-page print:block print:bg-white"
                  >
                    {/* Image Section */}
                    {/* On screen: 4/3 aspect ratio. On Print: Large top section, roughly half page height allowed for image */}
                    <div className="aspect-[4/3] bg-slate-100 relative group border-b border-slate-100 print:aspect-[16/10] print:mb-8 print:border-none print:bg-white print:w-full print:h-[45vh] print:max-h-[12cm]">
                      {generatedImages[org.name] ? (
                        <img 
                          src={generatedImages[org.name]} 
                          alt={org.name} 
                          className="w-full h-full object-cover print:object-contain print:h-full print:w-full"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 print:hidden">
                          {loadingImages[org.name] ? (
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <button
                              onClick={() => handleGenerateImage(org.name, org.imagePrompt || org.name)}
                              className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-lg shadow-sm text-sm font-medium hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              Visualize
                            </button>
                          )}
                          <p className="text-[10px] text-slate-400 mt-2 text-center">Click to generate AI diagram</p>
                        </div>
                      )}
                      {/* Fallback box for print if no image generated */}
                      {!generatedImages[org.name] && (
                         <div className="hidden print:flex w-full h-full border-2 border-dashed border-slate-200 items-center justify-center text-slate-400 bg-slate-50">
                            <div className="text-center">
                                <span className="text-4xl block mb-2">🖼️</span>
                                <span>No Image Generated</span>
                            </div>
                         </div>
                      )}
                    </div>

                    {/* Details Section */}
                    <div className="p-5 flex-grow flex flex-col print:p-0 print:block">
                      {/* Title Header */}
                      <div className="mb-3 print:mb-6 print:border-b print:border-slate-800 print:pb-4">
                        <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-bold tracking-wider text-emerald-700 bg-emerald-100 rounded-full uppercase print:bg-transparent print:text-emerald-800 print:p-0 print:text-sm print:mb-1">
                          {kingdom}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight print:text-4xl print:mb-1">{org.name}</h3>
                        <p className="text-sm text-slate-500 italic font-serif print:text-xl print:text-slate-600">{org.scientificName}</p>
                      </div>

                      {/* Info Grid */}
                      <div className="space-y-4 print:space-y-6">
                        {/* Habitat */}
                        <div>
                           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-slate-500 print:text-sm print:mb-1">Habitat</h4>
                           <p className="text-sm text-slate-700 font-medium print:text-lg print:text-slate-900">{org.habitat}</p>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-slate-500 print:text-sm print:mb-2">Description</h4>
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 print:line-clamp-none print:text-lg print:text-slate-800 print:leading-relaxed">
                            {org.description}
                          </p>
                        </div>

                        {/* Characteristics */}
                        <div className="flex-grow">
                           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:text-slate-500 print:text-sm">Characteristics</h4>
                           <ul className="text-xs text-slate-700 space-y-1 print:text-lg print:space-y-2 print:pl-2">
                             {org.characteristics.map((char, i) => (
                               <li key={i} className="flex items-start gap-1.5">
                                 <span className="text-emerald-400 mt-0.5 print:text-emerald-600 font-bold">•</span>
                                 {char}
                               </li>
                             ))}
                           </ul>
                        </div>
                      </div>

                      {/* Footer / Mnemonic */}
                      <div className="mt-auto pt-3 border-t border-slate-100 bg-amber-50 -mx-5 -mb-5 px-5 py-3 print:mx-0 print:mb-0 print:bg-slate-50 print:border print:border-slate-200 print:rounded-lg print:mt-8 print:p-6">
                        <div className="flex items-start gap-2 print:flex-col">
                            <span className="text-amber-500 mt-0.5 print:hidden">💡</span>
                            <div>
                                <span className="text-xs font-bold text-amber-800 block print:text-amber-900 print:text-sm print:mb-2 print:uppercase print:tracking-wide">Memory Trick</span>
                                <p className="text-xs text-amber-900 italic print:text-xl print:not-italic print:font-serif print:text-slate-900">"{org.mnemonic}"</p>
                            </div>
                        </div>
                      </div>
                      
                      {/* Page Number Footer (Print Only) */}
                      <div className="hidden print:flex justify-between items-end mt-12 pt-4 text-xs text-slate-400 border-t border-slate-200">
                         <span>BioBuddy • {kingdom}</span>
                         {/* CSS Counter will handle number */}
                         <span className="page-number font-mono"></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!loading && !collections[activeKingdom] && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="mb-4">No organisms loaded for {activeKingdom}.</p>
            <button 
                onClick={() => fetchKingdomData(activeKingdom)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
                Start Learning
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @media print {
          @page { 
            margin: 0; 
            size: A4; 
          }
          body { 
            background: white; 
            color: black;
            counter-reset: page;
          }
          .break-after-page {
            page-break-after: always;
          }
          /* Custom styles for better print readability */
          h1, h2, h3, h4 { color: #000 !important; }
          
          /* Page numbering logic */
          .page-number::after {
            counter-increment: page;
            content: "Page " counter(page);
          }
          
          /* Ensure graphics are printed */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide scrollbars */
          ::-webkit-scrollbar { display: none; }
          
          /* Container padding for print */
          .print\\:p-0 { padding: 20mm !important; }
        }
      `}</style>
    </div>
  );
};

export default Lesson;