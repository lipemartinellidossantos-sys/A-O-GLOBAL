import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Eye,
  Layers,
  Search,
  BookOpen,
  LayoutGrid
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { downloadFile, formatBytes } from '../utils/pdfHelper';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // Set up standard worker URL for pdfjs-dist
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker setup fallback:', e);
  }
}

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose?: () => void;
  fileUrl?: string | null;
  pdfUrl?: string | null;
  fileName?: string;
  title?: string;
  fileSizeBytes?: number;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  pdfUrl,
  fileName,
  title,
  fileSizeBytes,
}) => {
  const effectiveFileUrl = fileUrl || pdfUrl || null;
  const effectiveFileName = fileName || title || 'documento.pdf';

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);

  // PDF Document reference
  const pdfDocRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasksRef = useRef<Map<number, any>>(new Map());

  // Helper to cancel any in-flight render tasks
  const cancelAllRenderTasks = useCallback(() => {
    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {
        // ignore
      }
    });
    renderTasksRef.current.clear();
  }, []);

  // Determine file type
  const isHtmlData = Boolean(effectiveFileUrl && (effectiveFileUrl.startsWith('data:text/html') || effectiveFileUrl.includes('<html') || effectiveFileUrl.includes('<!DOCTYPE html>')));
  const isImageData = Boolean(effectiveFileUrl && (effectiveFileUrl.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(effectiveFileName || '')));
  const isPdf = !isHtmlData && !isImageData;

  // Convert Base64 or Data URI to Uint8Array for PDF.js
  const getPdfData = useCallback((dataUrlOrStr: string): Uint8Array | string => {
    if (dataUrlOrStr.startsWith('data:application/pdf;base64,') || dataUrlOrStr.startsWith('data:application/octet-stream;base64,')) {
      const base64Index = dataUrlOrStr.indexOf(';base64,') + 8;
      const base64 = dataUrlOrStr.substring(base64Index);
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    
    // If it's a raw base64 string starting with JVBERi0 (PDF magic header)
    if (dataUrlOrStr.startsWith('JVBERi0')) {
      const binaryString = window.atob(dataUrlOrStr);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    return dataUrlOrStr;
  }, []);

  // Load PDF Document when effectiveFileUrl changes
  useEffect(() => {
    if (!isOpen || !effectiveFileUrl || !isPdf) {
      if (isHtmlData || isImageData) {
        setIsLoading(false);
        setLoadError(null);
      }
      return;
    }

    let isMounted = true;
    cancelAllRenderTasks();
    setIsLoading(true);
    setLoadError(null);
    setNumPages(0);
    setCurrentPage(1);

    const loadPdf = async () => {
      try {
        const source = getPdfData(effectiveFileUrl);
        const loadingTask = typeof source === 'string' 
          ? pdfjsLib.getDocument({ url: source })
          : pdfjsLib.getDocument({ data: source });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error rendering PDF with PDF.js:', err);
        if (!isMounted) return;
        setLoadError(err?.message || 'Não foi possível renderizar o arquivo PDF diretamente.');
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      cancelAllRenderTasks();
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy?.();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [isOpen, effectiveFileUrl, isPdf, isHtmlData, isImageData, getPdfData, cancelAllRenderTasks]);

  // Render Page on Canvas
  const renderPage = useCallback(async (pageNum: number, canvas: HTMLCanvasElement | null) => {
    if (!canvas || !pdfDocRef.current) return;

    // Cancel any previous in-flight render operation on this page canvas
    const existingTask = renderTasksRef.current.get(pageNum);
    if (existingTask) {
      try {
        existingTask.cancel();
      } catch {
        // ignore
      }
      renderTasksRef.current.delete(pageNum);
    }

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1, rotation });
      
      // Calculate responsive scale based on zoom
      const targetScale = (zoom / 100) * 1.5; // High-DPI sharpness factor
      const viewport = page.getViewport({ scale: targetScale, rotation });

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Display size scaled
      const displayWidth = (baseViewport.width * (zoom / 100));
      const displayHeight = (baseViewport.height * (zoom / 100));
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTasksRef.current.set(pageNum, renderTask);

      await renderTask.promise;
    } catch (err: any) {
      if (
        err?.name !== 'RenderingCancelledException' && 
        err?.message !== 'Rendering cancelled' &&
        !err?.message?.includes?.('cancelled')
      ) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    } finally {
      renderTasksRef.current.delete(pageNum);
    }
  }, [zoom, rotation]);

  // Render all active pages when doc, zoom, rotation, or viewMode changes
  useEffect(() => {
    if (!pdfDocRef.current || numPages === 0 || !isPdf) return;

    if (viewMode === 'all') {
      for (let p = 1; p <= numPages; p++) {
        const canvas = canvasRefs.current.get(p);
        if (canvas) {
          renderPage(p, canvas);
        }
      }
    } else {
      const canvas = canvasRefs.current.get(currentPage);
      if (canvas) {
        renderPage(currentPage, canvas);
      }
    }
  }, [numPages, zoom, rotation, viewMode, currentPage, isPdf, renderPage]);

  // Download Handler
  const handleDownload = () => {
    if (!effectiveFileUrl) return;
    downloadFile(effectiveFileUrl, effectiveFileName || 'documento_obra.pdf');
  };

  // Print Handler
  const handlePrint = () => {
    if (isHtmlData) {
      const iframe = document.getElementById('html-preview-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      }
    }

    // PDF Print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const canvases = Array.from(canvasRefs.current.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, canvas]) => `<div style="page-break-after: always; text-align: center; margin-bottom: 20px;"><img src="${canvas.toDataURL('image/png')}" style="max-width: 100%; height: auto;" /></div>`)
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir - ${effectiveFileName}</title>
          <style>
            body { margin: 0; padding: 10px; background: white; }
            @media print {
              body { padding: 0; }
              div { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${canvases}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(250, prev + 15));
  const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 15));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetZoom = () => setZoom(100);

  if (!isOpen || !effectiveFileUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all overflow-hidden ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-full max-w-6xl h-[92vh]'
        }`}
      >
        {/* TOP TOOLBAR */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 shrink-0 select-none">
          {/* File Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-md" title={effectiveFileName}>
                {effectiveFileName}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  Visualizador Integrado
                </span>
                {numPages > 0 && isPdf && (
                  <>
                    <span>•</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {numPages} {numPages === 1 ? 'página' : 'páginas'}
                    </span>
                  </>
                )}
                {fileSizeBytes && (
                  <>
                    <span>•</span>
                    <span>{formatBytes(fileSizeBytes)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Viewer Controls */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* View Mode Toggle (Single Page vs Continuous Scroll) */}
            {isPdf && numPages > 1 && (
              <div className="hidden md:flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Exibir todas as páginas (Rolagem contínua)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Todas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    viewMode === 'single'
                      ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Exibir página por página"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Páginas</span>
                </button>
              </div>
            )}

            {/* Pagination Controls in Single Page Mode */}
            {isPdf && viewMode === 'single' && numPages > 1 && (
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 text-slate-600 dark:text-slate-300 hover:text-orange-600 disabled:opacity-40 cursor-pointer"
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                  {currentPage} / {numPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                  className="p-1 text-slate-600 dark:text-slate-300 hover:text-orange-600 disabled:opacity-40 cursor-pointer"
                  title="Próxima Página"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-orange-600 cursor-pointer"
                title="Redefinir Zoom para 100%"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate Button */}
            {isPdf && (
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Girar 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Imprimir Documento"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:block p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'Restaurar Tamanho' : 'Tela Cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Download Button */}
            <button
              id="btn-download-modal-pdf"
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Fazer Download do Arquivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar</span>
            </button>

            {/* Close Modal Button */}
            <button
              id="btn-close-pdf-modal"
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Fechar Visualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEWER BODY */}
        <div 
          ref={containerRef}
          className="flex-1 bg-slate-200/80 dark:bg-slate-950 p-3 sm:p-6 overflow-auto flex flex-col items-center justify-start relative"
        >
          {/* Loading Indicator */}
          {isLoading && (
            <div className="my-auto flex flex-col items-center justify-center p-12 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Carregando e renderizando documento...
              </div>
              <p className="text-[11px] text-slate-500">Preparando visualização direta sem download</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && loadError && (
            <div className="my-auto max-w-md p-6 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-center space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Não foi possível carregar a prévia do PDF</h4>
                <p className="text-xs text-slate-500 mt-1">{loadError}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* HTML / Contract Minuta Preview */}
          {!isLoading && !loadError && isHtmlData && (
            <div 
              className="w-full h-full min-h-[600px] bg-white rounded-xl shadow-xl overflow-hidden border border-slate-300 dark:border-slate-700 transition-all origin-top flex justify-center"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <iframe
                id="html-preview-iframe"
                src={effectiveFileUrl}
                title={effectiveFileName}
                className="w-full h-full border-none min-h-[700px] bg-white"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          )}

          {/* Image Preview */}
          {!isLoading && !loadError && isImageData && (
            <div 
              className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xl border border-slate-300 dark:border-slate-800 transition-transform origin-top flex items-center justify-center my-auto"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <img 
                src={effectiveFileUrl} 
                alt={effectiveFileName} 
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          )}

          {/* Rendered PDF Pages via PDF.js Canvas */}
          {!isLoading && !loadError && isPdf && numPages > 0 && (
            <div className="flex flex-col items-center gap-6 w-full py-2">
              {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNum) => {
                const isPageVisible = viewMode === 'all' || currentPage === pageNum;
                if (!isPageVisible) return null;

                return (
                  <div 
                    key={pageNum}
                    className="flex flex-col items-center group relative shadow-2xl rounded-sm overflow-hidden bg-white border border-slate-300 dark:border-slate-700"
                  >
                    {/* Page Number Indicator */}
                    {numPages > 1 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-[10px] font-bold backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        Pág. {pageNum} de {numPages}
                      </div>
                    )}
                    
                    <canvas
                      ref={(el) => {
                        if (el) {
                          canvasRefs.current.set(pageNum, el);
                          renderPage(pageNum, el);
                        } else {
                          const existingTask = renderTasksRef.current.get(pageNum);
                          if (existingTask) {
                            try {
                              existingTask.cancel();
                            } catch {
                              // ignore
                            }
                            renderTasksRef.current.delete(pageNum);
                          }
                          canvasRefs.current.delete(pageNum);
                        }
                      }}
                      className="bg-white block"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BOTTOM STATUS FOOTER */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
          <div className="flex items-center gap-2 font-medium truncate">
            <span className="text-slate-900 dark:text-slate-200 font-semibold truncate">{effectiveFileName}</span>
            {isPdf && numPages > 0 && (
              <span className="font-mono text-slate-500">
                (Visualizando {viewMode === 'all' ? `todas as ${numPages} páginas` : `página ${currentPage} de ${numPages}`})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-slate-500">Zoom: {zoom}%</span>
            {rotation > 0 && <span className="font-mono text-slate-500">Rotação: {rotation}°</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
