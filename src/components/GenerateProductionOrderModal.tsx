import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Kanban, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Hash, 
  Scale, 
  Paintbrush, 
  FileText, 
  Plus, 
  Minus, 
  Check, 
  Printer, 
  Clock, 
  Tag, 
  FolderCheck,
  ChevronRight,
  RefreshCw,
  UploadCloud,
  Download,
  Eye,
  Trash2,
  Paperclip
} from 'lucide-react';
import { 
  WorkProject, 
  ContractedProductItem, 
  ProductionOrderItem, 
  WorkStatus,
  ContractAttachment,
  FactoryStageConfig
} from '../types';
import { formatCurrency, formatDate, StorageService, calculateProgressForStatus } from '../services/storage';
import { PdfViewerModal } from './PdfViewerModal';
import { downloadFile, generateProductionOrderDrawingPdfDataUrl } from '../utils/pdfHelper';

interface GenerateProductionOrderModalProps {
  isOpen: boolean;
  onClose?: () => void;
  project: WorkProject | null;
  projects?: WorkProject[];
  initialProductId?: string;
  onSaveOrder: (updatedProject: WorkProject, newOrder: ProductionOrderItem) => void;
  onNavigateToKanban?: (projectId: string) => void;
}

export const GenerateProductionOrderModal: React.FC<GenerateProductionOrderModalProps> = ({
  isOpen,
  onClose,
  project,
  projects = [],
  initialProductId,
  onSaveOrder,
  onNavigateToKanban
}) => {
  if (!isOpen || !project) return null;

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Selected Product State
  const products = project.contractedProducts || [];
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    if (initialProductId && products.some(p => p.id === initialProductId)) {
      return initialProductId;
    }
    return products[0]?.id || '';
  });

  // PDF Viewer Modal State
  const [pdfViewerState, setPdfViewerState] = useState<{
    isOpen: boolean;
    url: string | null;
    fileName: string;
    fileSizeBytes?: number;
  }>({
    isOpen: false,
    url: null,
    fileName: '',
  });

  // PDF Attachment for the Order being emitted
  const [attachedPdf, setAttachedPdf] = useState<ContractAttachment | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // When initialProductId changes or modal opens
  useEffect(() => {
    if (initialProductId && products.some(p => p.id === initialProductId)) {
      setSelectedProductId(initialProductId);
    } else if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [initialProductId, project]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Calcs for Selected Product
  const quantityTotal = selectedProduct ? selectedProduct.quantityTotal : 0;
  const quantityInProduction = selectedProduct ? (selectedProduct.quantityInProduction || 0) : 0;
  const pendingBalance = Math.max(0, quantityTotal - quantityInProduction);
  const isFullyScheduled = pendingBalance === 0 && quantityTotal > 0;

  // Factory stages configured in System Settings
  const factoryStages = useMemo<FactoryStageConfig[]>(() => {
    const list = StorageService.getFactoryStages();
    return list && list.length > 0 ? [...list].sort((a, b) => a.order - b.order) : [];
  }, []);

  // Form inputs
  const [osQuantity, setOsQuantity] = useState<number>(() => pendingBalance > 0 ? pendingBalance : 1);
  const [osNumber, setOsNumber] = useState<string>(() => {
    return project.orderCode || project.code;
  });
  const [issuedAt, setIssuedAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deadlineDate, setDeadlineDate] = useState<string>(project.deadlineDate || new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('baixa');
  const [initialStage, setInitialStage] = useState<WorkStatus>(() => {
    const list = StorageService.getFactoryStages().sort((a, b) => a.order - b.order);
    return list[0]?.statusMapping || 'entrada';
  });
  const [paintColor, setPaintColor] = useState<string>('');
  const [assignedTeam, setAssignedTeam] = useState<string>('Equipe Fabril Principal');
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'emitir' | 'historico'>('emitir');

  // Update osQuantity when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      const qTotal = selectedProduct.quantityTotal;
      const qInProd = selectedProduct.quantityInProduction || 0;
      const rem = Math.max(0, qTotal - qInProd);
      setOsQuantity(rem > 0 ? rem : 1);
      // Preload product PDF attachment if available
      if (selectedProduct.pdfAttachment && !attachedPdf) {
        setAttachedPdf(selectedProduct.pdfAttachment);
      }
    }
  }, [selectedProductId]);

  // Handle PDF file upload
  const handlePdfUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAttachedPdf({
        id: `pdf-po-${Date.now()}`,
        name: file.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileDataUrl: dataUrl,
        fileType: file.type || 'application/pdf',
        documentTitle: `Desenho Técnico - ${file.name}`
      });
    };
    reader.readAsDataURL(file);
  };

  // Helper to get or generate PDF Data URL for any order
  const getOrderPdfDataUrl = (order: ProductionOrderItem): string => {
    if (order.pdfAttachment?.fileDataUrl) {
      return order.pdfAttachment.fileDataUrl;
    }
    return generateProductionOrderDrawingPdfDataUrl({
      osNumber: order.osNumber,
      projectCode: order.projectCode || project.code,
      projectTitle: order.projectTitle || project.title,
      clientName: order.clientName || project.clientName,
      productDescription: order.productDescription,
      quantity: order.quantity,
      unit: order.unit,
      issuedAt: order.issuedAt,
      deadlineDate: order.deadlineDate,
      paintColor: order.paintColor,
      assignedTeam: order.assignedTeam,
      notes: order.notes,
      structureType: order.structureType || selectedProduct?.structureType,
      weightKgEstimated: order.weightKgEstimated
    });
  };

  // Calculations for preview
  const newBalanceRemaining = Math.max(0, pendingBalance - osQuantity);
  const willCompleteProduct = osQuantity >= pendingBalance && pendingBalance > 0;
  const progressAfterThisOrder = quantityTotal > 0 
    ? Math.min(100, Math.round(((quantityInProduction + osQuantity) / quantityTotal) * 100))
    : 100;

  // Handler for quick quantity buttons
  const handleSetQuickQuantity = (amount: number) => {
    const clamped = Math.max(1, Math.min(pendingBalance > 0 ? pendingBalance : quantityTotal, amount));
    setOsQuantity(clamped);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || osQuantity <= 0) return;

    const validatedQty = Math.min(osQuantity, pendingBalance > 0 ? pendingBalance : osQuantity);
    const newQtyInProd = (selectedProduct.quantityInProduction || 0) + validatedQty;
    const newRemaining = Math.max(0, selectedProduct.quantityTotal - newQtyInProd);
    const isNowComplete = newQtyInProd >= selectedProduct.quantityTotal;

    // Build effective PDF attachment (uploaded file or generated drawing)
    const effectivePdf: ContractAttachment = attachedPdf || {
      id: `pdf-po-${Date.now()}`,
      name: `Desenho_Fabril_${osNumber.trim() || 'OP'}.pdf`,
      sizeBytes: 128000,
      uploadedAt: issuedAt,
      fileDataUrl: generateProductionOrderDrawingPdfDataUrl({
        osNumber: osNumber.trim() || `OP-${Date.now()}`,
        projectCode: project.code,
        projectTitle: project.title,
        clientName: project.clientName,
        productDescription: selectedProduct.description,
        structureType: selectedProduct.structureType,
        quantity: validatedQty,
        unit: selectedProduct.unit,
        issuedAt,
        deadlineDate,
        paintColor,
        assignedTeam,
        notes: notes.trim() || undefined,
      }),
      fileType: 'application/pdf',
      documentTitle: `Ordem Fabril e Desenho Técnico ${osNumber.trim()}`
    };

    // Create New Production Order item
    const newOrder: ProductionOrderItem = {
      id: `po-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      osNumber: osNumber.trim() || `OP-${Date.now()}`,
      projectId: project.id,
      projectCode: project.code,
      projectTitle: project.title,
      clientName: project.clientName,
      productId: selectedProduct.id,
      productDescription: selectedProduct.description,
      structureType: selectedProduct.structureType,
      quantity: validatedQty,
      unit: selectedProduct.unit,
      quantityProduced: 0,
      issuedAt,
      deadlineDate,
      status: initialStage,
      priority,
      paintColor,
      assignedTeam,
      notes: notes.trim() || `Ordem de Produção emitida para lote de ${validatedQty} ${selectedProduct.unit}.`,
      isCompleted: false,
      pdfAttachment: effectivePdf
    };

    // Update Product in Project
    const updatedProducts: ContractedProductItem[] = (project.contractedProducts || []).map(p => {
      if (p.id === selectedProduct.id) {
        const prodOrders = p.productionOrders || [];
        return {
          ...p,
          quantityInProduction: newQtyInProd,
          quantityRemainingToProduce: newRemaining,
          osNumber: p.osNumber || newOrder.osNumber,
          productionStatus: initialStage,
          productionOrderGenerated: true,
          productionOrderGeneratedAt: issuedAt,
          productionOrders: [newOrder, ...prodOrders],
          status: isNowComplete ? 'pendente' : p.status,
          pdfAttachment: effectivePdf
        };
      }
      return p;
    });

    const existingProjectOrders = project.productionOrders || [];
    const computedProgress = calculateProgressForStatus(initialStage, factoryStages);

    const updatedProject: WorkProject = {
      ...project,
      status: initialStage, // Obra vai para a etapa 1 (1. Ordem de Produção Pronta para Descer para Fábrica)
      progressPercent: Math.max(project.progressPercent || 0, computedProgress > 0 ? computedProgress : 15),
      osNumber: project.osNumber || newOrder.osNumber,
      osCreatedAt: project.osCreatedAt || issuedAt,
      productionOrderGenerated: true,
      productionOrderGeneratedAt: issuedAt,
      productionOrderNotes: `Última OP ${newOrder.osNumber} gerada com ${validatedQty} ${selectedProduct.unit}.`,
      contractedProducts: updatedProducts,
      productionOrders: [newOrder, ...existingProjectOrders]
    };

    onSaveOrder(updatedProject, newOrder);
    handleClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* MODAL HEADER */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 shrink-0">
                <Kanban className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded-full border border-orange-800/80 font-mono">
                    PCP & Fábrica
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Obra: {project.code}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                  Emitir Ordem de Produção (Entrada no Fluxo Fabril)
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View History vs Create Tab */}
              <div className="hidden sm:flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('emitir')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    activeTab === 'emitir' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gerar Ordem
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('historico')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'historico' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Histórico de OPs</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] font-mono">
                    {project.productionOrders?.length || 0}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PROJECT SUMMARY INFO BANNER */}
          <div className="bg-slate-100 dark:bg-slate-800/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Obra</span>
                <span className="font-bold text-slate-900 dark:text-white">{project.title}</span>
              </div>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Cliente</span>
                <span className="font-bold text-slate-900 dark:text-white">{project.clientName}</span>
              </div>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Prazo Contratual</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">{formatDate(project.deadlineDate)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Destino: 0. Não Iniciada (Fábrica)
              </span>
            </div>
          </div>

          {/* MODAL BODY */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {activeTab === 'historico' ? (
              /* HISTÓRICO DE ORDENS DE PRODUÇÃO */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span>Ordens de Produção Geradas para esta Obra ({project.productionOrders?.length || 0})</span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => setActiveTab('emitir')}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Emitir Nova Ordem</span>
                  </button>
                </div>

                {(!project.productionOrders || project.productionOrders.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <Kanban className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhuma Ordem de Produção emitida ainda.</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">Selecione um produto e emita o primeiro lote de produção com o desenho técnico anexo.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('emitir')}
                      className="mt-3 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-600/20 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Gerar Primeira Ordem</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {project.productionOrders.map((order, idx) => {
                      const pdfUrl = getOrderPdfDataUrl(order);
                      const pdfName = order.pdfAttachment?.name || `Desenho_Fabril_${order.osNumber}.pdf`;

                      return (
                        <div 
                          key={order.id || idx}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-800 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                  {order.osNumber}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  0. Não Iniciada
                                </span>
                                <span className="text-[10px] text-slate-600 dark:text-slate-300">
                                  Emitida em: {formatDate(order.issuedAt)}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
                                {order.productDescription}
                              </p>

                              <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 mt-1 flex-wrap">
                                <span>Lote Liberado: <strong className="text-slate-900 dark:text-white font-mono">{order.quantity} {order.unit}</strong></span>
                                {order.paintColor ? (
                                  <span>Pintura: <strong>{order.paintColor}</strong></span>
                                ) : null}
                              </div>

                              {/* PDF Attachment Badge */}
                              <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900 text-[10px] font-bold">
                                  <FileText className="w-3 h-3 text-orange-600" />
                                  <span>{pdfName}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                            {/* Botão para apenas visualizar o PDF */}
                            <button
                              type="button"
                              onClick={() => {
                                setPdfViewerState({
                                  isOpen: true,
                                  url: pdfUrl,
                                  fileName: pdfName,
                                  fileSizeBytes: order.pdfAttachment?.sizeBytes || 128000
                                });
                              }}
                              className="px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Apenas Visualizar PDF da Ordem / Desenho"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Visualizar PDF</span>
                            </button>

                            {/* Botão para fazer o Download do PDF */}
                            <button
                              type="button"
                              onClick={() => downloadFile(pdfUrl, pdfName)}
                              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Fazer Download do PDF da Ordem"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPdfViewerState({
                                  isOpen: true,
                                  url: pdfUrl,
                                  fileName: pdfName,
                                  fileSizeBytes: order.pdfAttachment?.sizeBytes || 128000
                                });
                              }}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title="Imprimir Ordem de Produção"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {onNavigateToKanban && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleClose();
                                  onNavigateToKanban(project.id);
                                }}
                                className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Kanban className="w-3.5 h-3.5" />
                                <span>Ver no Fluxo</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* EMISSÃO DE NOVA ORDEM DE PRODUÇÃO */
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* PASSO 1: SELEÇÃO DO PRODUTO CONTRATADO */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                    <span>1. Selecione o Produto Contratado para Produção</span>
                    <span className="text-[11px] font-normal text-slate-600 dark:text-slate-300">
                      {products.length} {products.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {products.map((prod) => {
                      const isSelected = prod.id === selectedProductId;
                      const qTot = prod.quantityTotal || 1;
                      const qInP = prod.quantityInProduction || 0;
                      const qRem = Math.max(0, qTot - qInP);
                      const isDone = qRem === 0;
                      const pctInProd = Math.min(100, Math.round((qInP / qTot) * 100));

                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setSelectedProductId(prod.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'bg-orange-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                                <Layers className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                                  {prod.description}
                                </span>
                                {prod.structureType && (
                                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold block">
                                    {prod.structureType}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isDone ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 shrink-0 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                100% OK
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 shrink-0 font-mono">
                                Resta: {qRem} {prod.unit}
                              </span>
                            )}
                          </div>

                          {/* Progress bar of quantity in production */}
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
                              <span>Total Contratado: <strong className="font-mono text-slate-900 dark:text-white">{qTot} {prod.unit}</strong></span>
                              <span>Em Produção: <strong className="font-mono text-orange-600 dark:text-orange-400">{qInP} {prod.unit} ({pctInProd}%)</strong></span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  isDone ? 'bg-emerald-500' : 'bg-orange-500'
                                }`} 
                                style={{ width: `${pctInProd}%` }} 
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PASSO 2: DEFINIÇÃO DA QUANTIDADE A ENTRAR EM PRODUÇÃO E DESCONTO AUTOMÁTICO */}
                {selectedProduct && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-white dark:from-orange-950/30 dark:via-slate-800/60 dark:to-slate-900 border border-orange-200 dark:border-orange-900/60 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-orange-600" />
                          <span>2. Quantidade a Entrar em Produção nesta Ordem</span>
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          A quantidade informada será deduzida automaticamente do saldo pendente do produto <strong className="text-slate-900 dark:text-white font-semibold">{selectedProduct.description}</strong>.
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Saldo Pendente Atual</span>
                        <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                          {pendingBalance} {selectedProduct.unit}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Input with incrementers */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-6 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOsQuantity(prev => Math.max(1, prev - 1))}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            max={pendingBalance > 0 ? pendingBalance * 2 : 1000}
                            value={osQuantity}
                            onChange={(e) => setOsQuantity(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full text-center py-2 px-3 bg-white dark:bg-slate-900 border-2 border-orange-500 rounded-xl font-mono font-black text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {selectedProduct.unit}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setOsQuantity(prev => (pendingBalance > 0 ? Math.min(pendingBalance, prev + 1) : prev + 1))}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Selection Pills */}
                      <div className="sm:col-span-6 flex flex-wrap items-center gap-1.5">
                        {pendingBalance > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetQuickQuantity(pendingBalance)}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] transition-colors shadow-xs cursor-pointer"
                          >
                            Tudo ({pendingBalance} {selectedProduct.unit})
                          </button>
                        )}

                        {pendingBalance > 1 && (
                          <button
                            type="button"
                            onClick={() => handleSetQuickQuantity(Math.ceil(pendingBalance / 2))}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            50% ({Math.ceil(pendingBalance / 2)} {selectedProduct.unit})
                          </button>
                        )}

                        {pendingBalance >= 10 && (
                          <button
                            type="button"
                            onClick={() => handleSetQuickQuantity(10)}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Lote 10
                          </button>
                        )}

                        {pendingBalance >= 25 && (
                          <button
                            type="button"
                            onClick={() => handleSetQuickQuantity(25)}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Lote 25
                          </button>
                        )}
                      </div>
                    </div>

                    {/* REAL-TIME BALANCE RECALCULATION PREVIEW */}
                    <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Total Contratado:</span>
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {quantityTotal} {selectedProduct.unit}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Total Liberado c/ esta OS:</span>
                        <span className="font-mono font-black text-orange-600 dark:text-orange-400">
                          {quantityInProduction + osQuantity} {selectedProduct.unit} ({progressAfterThisOrder}%)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Saldo Pendente que Restará:</span>
                        <span className={`font-mono font-black ${
                          newBalanceRemaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {newBalanceRemaining} {selectedProduct.unit}
                        </span>
                      </div>
                    </div>

                    {/* COMPLETION BADGE / CELEBRATION */}
                    {willCompleteProduct && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>
                          Excelente! Esta ordem atingirá <strong>100% da quantidade programada</strong> para este produto. Ao salvar, o item receberá status <strong>OK (Totalmente Programado)</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* PASSO 3: ANEXO DO PDF DA ORDEM E DESENHO DE PRODUÇÃO */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-orange-600" />
                      <span>3. Anexar PDF da Ordem / Desenho de Produção para a Fábrica</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      PDF, DWG, PNG ou JPG
                    </span>
                  </div>

                  {attachedPdf ? (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                            {attachedPdf.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {Math.round(attachedPdf.sizeBytes / 1024)} KB • Anexado em {attachedPdf.uploadedAt}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Botão para apenas visualizar o PDF */}
                        <button
                          type="button"
                          onClick={() => {
                            setPdfViewerState({
                              isOpen: true,
                              url: attachedPdf.fileDataUrl || generateProductionOrderDrawingPdfDataUrl({
                                osNumber,
                                projectCode: project.code,
                                projectTitle: project.title,
                                clientName: project.clientName,
                                productDescription: selectedProduct?.description || 'Item de Produção',
                                quantity: osQuantity,
                                unit: selectedProduct?.unit || 'un',
                                issuedAt,
                                deadlineDate,
                                paintColor,
                                assignedTeam,
                                notes,
                                structureType: selectedProduct?.structureType
                              }),
                              fileName: attachedPdf.name,
                              fileSizeBytes: attachedPdf.sizeBytes
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizar PDF</span>
                        </button>

                        {/* Botão para download do PDF */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = attachedPdf.fileDataUrl || generateProductionOrderDrawingPdfDataUrl({
                              osNumber,
                              projectCode: project.code,
                              projectTitle: project.title,
                              clientName: project.clientName,
                              productDescription: selectedProduct?.description || 'Item de Produção',
                              quantity: osQuantity,
                              unit: selectedProduct?.unit || 'un',
                              issuedAt,
                              deadlineDate,
                              paintColor,
                              assignedTeam,
                              notes,
                              structureType: selectedProduct?.structureType
                            });
                            downloadFile(url, attachedPdf.name);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>

                        {/* Botão remover */}
                        <button
                          type="button"
                          onClick={() => setAttachedPdf(null)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="Remover anexo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                      onDragLeave={() => setIsDraggingPdf(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingPdf(false);
                        handlePdfUpload(e.dataTransfer.files);
                      }}
                      onClick={() => pdfInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        isDraggingPdf
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-300 dark:border-slate-700 hover:border-orange-400 hover:bg-white dark:hover:bg-slate-900'
                      }`}
                    >
                      <UploadCloud className="w-7 h-7 text-orange-600 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Clique para anexar o PDF da Ordem / Desenho Técnico que desceu para a fábrica
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Caso não anexe, o sistema gerará automaticamente o Desenho Técnico Oficial com cotas e memorial
                      </p>
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.dwg"
                        onChange={(e) => handlePdfUpload(e.target.files)}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* PASSO 4: DADOS TÉCNICOS DA ORDEM DE PRODUÇÃO */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span>4. Especificações da Ordem Fabril (OS)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Código / Número da OS (Código do Pedido)
                      </label>
                      <input
                        type="text"
                        value={osNumber}
                        onChange={(e) => setOsNumber(e.target.value)}
                        required
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-xs"
                        placeholder="Código do Pedido / OS"
                      />
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 block">
                        Mesmo código do pedido cadastrado na obra: <strong className="text-slate-900 dark:text-white">{project.orderCode || project.code}</strong>
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Data de Liberação (Emissão)
                      </label>
                      <input
                        type="date"
                        value={issuedAt}
                        onChange={(e) => setIssuedAt(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Prazo Limite na Fábrica
                      </label>
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono font-bold text-orange-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Etapa Inicial no Fluxo
                      </label>
                      <select
                        value={initialStage}
                        onChange={(e) => setInitialStage(e.target.value as WorkStatus)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:border-orange-500"
                      >
                        {factoryStages.length > 0 ? (
                          factoryStages.map((st) => (
                            <option key={st.id} value={st.statusMapping || 'nao_iniciada'}>
                              {st.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="nao_iniciada">0. Não Iniciada (Aguardando OS)</option>
                            <option value="entrada">1. Entrada e Liberação PCP</option>
                            <option value="producao">2. Corte e Perfis CNC</option>
                            <option value="furacao">3. Furação e Preparação</option>
                            <option value="solda">4. Soldagem Estrutural</option>
                            <option value="jateamento">5. Jateamento e Pintura</option>
                            <option value="montagem">6. Pré-Montagem / Expedição</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Pintura / Acabamento
                      </label>
                      <input
                        type="text"
                        value={paintColor}
                        onChange={(e) => setPaintColor(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-orange-500"
                        placeholder="Ex: Primer Anticorrosivo + Esmalte Grafite / Preto Fosco"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Prioridade Fabril
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:border-orange-500"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente / Crítica</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Instruções Técnicas e Observações Fabris
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                      placeholder="Ex: Seguir desenho DWG-04 rev 2. Realizar ensaio não destrutivo de solda."
                    />
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    * A ordem será gerada com o desenho técnico anexo e inserida na coluna <strong className="text-slate-900 dark:text-white">0. Não Iniciada</strong> do Fluxo Fabril.
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                        willCompleteProduct
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                          : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
                      }`}
                    >
                      {willCompleteProduct ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Emitir Ordem & Dar OK (100% Programado)</span>
                        </>
                      ) : (
                        <>
                          <Kanban className="w-4 h-4" />
                          <span>Emitir Ordem de Produção ({osQuantity} {selectedProduct?.unit || 'un'})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewerState.isOpen && pdfViewerState.url && (
        <PdfViewerModal
          isOpen={pdfViewerState.isOpen}
          onClose={() => setPdfViewerState({ isOpen: false, url: null, fileName: '' })}
          fileUrl={pdfViewerState.url}
          fileName={pdfViewerState.fileName}
          fileSizeBytes={pdfViewerState.fileSizeBytes}
        />
      )}
    </>
  );
};
