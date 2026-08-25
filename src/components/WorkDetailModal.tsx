import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  HardHat, 
  Building, 
  Truck, 
  FileText, 
  Layers, 
  AlertCircle,
  Clock,
  Sparkles,
  User,
  Hash,
  Paintbrush,
  Maximize2,
  PackageCheck,
  ChevronRight,
  ShieldCheck,
  Edit3,
  Archive,
  ArchiveRestore,
  History,
  Kanban,
  Eye,
  Download,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { 
  WorkProject, 
  WorkStatus, 
  QualityChecklistItem, 
  InstallationTeam, 
  Seller, 
  Client, 
  ContractedProductItem,
  ContractAttachment 
} from '../types';
import { 
  formatCurrency, 
  formatKg, 
  formatDate, 
  STATUS_LABELS,
  calculateProgressForStatus 
} from '../services/storage';
import { ConfirmModal } from './ConfirmModal';
import { EditWorkModal } from './EditWorkModal';
import { PdfViewerModal } from './PdfViewerModal';
import { 
  downloadFile, 
  generateSampleContractPdfDataUrl, 
  generateProductionOrderDrawingPdfDataUrl,
  formatBytes 
} from '../utils/pdfHelper';

interface WorkDetailModalProps {
  project: WorkProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: WorkProject) => void;
  onDelete: (projectId: string) => void;
  teams?: InstallationTeam[];
  clients?: Client[];
  sellers?: Seller[];
  canEdit?: boolean;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
  teams = [],
  clients = [],
  sellers = [],
  canEdit = true,
}) => {
  if (!isOpen || !project) return null;

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Tabs: Main Scope / OS, Checklist de Qualidade, Histórico de OS and Contratos PDF
  const [activeTab, setActiveTab] = useState<'geral' | 'checklist' | 'historico_os' | 'contratos_pdf'>('geral');
  const [formData, setFormData] = useState<WorkProject>({ ...project });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditWorkModalOpen, setIsEditWorkModalOpen] = useState(false);

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

  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      setFormData({ ...project });
    }
  }, [project]);

  // Handler for uploading PDF files
  const handleUploadContractFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newAttachment: ContractAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileDataUrl: dataUrl,
        fileType: file.type || 'application/pdf',
        documentTitle: `Contrato de Obra - ${formData.code}`,
      };

      const updatedFiles = [...(formData.contractFiles || []), newAttachment];
      const updatedProject: WorkProject = {
        ...formData,
        contractFiles: updatedFiles,
      };

      setFormData(updatedProject);
      onSave(updatedProject);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteContractFile = (fileId: string) => {
    const updatedFiles = (formData.contractFiles || []).filter(f => f.id !== fileId);
    const updatedProject: WorkProject = {
      ...formData,
      contractFiles: updatedFiles,
    };
    setFormData(updatedProject);
    onSave(updatedProject);
  };

  const getContractPdfUrl = (file?: ContractAttachment): string => {
    if (file?.fileDataUrl) return file.fileDataUrl;
    return generateSampleContractPdfDataUrl({
      code: formData.code,
      title: formData.title,
      clientName: formData.clientName,
      contractedValue: formData.contractedValue,
      startDate: formData.startDate,
      deadlineDate: formData.deadlineDate,
      steelWeightKg: formData.steelWeightKg,
      contractedProducts: formData.contractedProducts,
    });
  };

  const getActiveOrderPdfUrl = (): string => {
    // 1. Check if there are production orders with pdfAttachment
    const latestOrder = formData.productionOrders && formData.productionOrders.length > 0
      ? formData.productionOrders[formData.productionOrders.length - 1]
      : null;

    if (latestOrder?.pdfAttachment?.fileDataUrl) {
      return latestOrder.pdfAttachment.fileDataUrl;
    }

    // 2. Check if project has contract/project files
    if (formData.contractFiles && formData.contractFiles.length > 0) {
      return formData.contractFiles[0].fileDataUrl;
    }

    // 3. Check if any contracted product has a drawing/PDF attached
    const productWithPdf = formData.contractedProducts?.find(p => p.pdfAttachment?.fileDataUrl);
    if (productWithPdf?.pdfAttachment?.fileDataUrl) {
      return productWithPdf.pdfAttachment.fileDataUrl;
    }

    // 4. Generate drawing for this active OS
    return generateProductionOrderDrawingPdfDataUrl({
      osNumber: formData.osNumber || latestOrder?.osNumber || `OS-${formData.code}`,
      projectCode: formData.code,
      projectTitle: formData.title,
      clientName: formData.clientName,
      productDescription: formData.contractedProducts?.[0]?.description || formData.title,
      quantity: formData.contractedProducts?.[0]?.quantityTotal || 1,
      unit: formData.contractedProducts?.[0]?.unit || 'un',
      issuedAt: formData.startDate || new Date().toISOString().split('T')[0],
      deadlineDate: formData.deadlineDate,
      paintColor: formData.color || 'Primer Epóxi',
      assignedTeam: formData.teamName || formData.assemblerName || 'Fábrica e Montagem',
      notes: formData.description,
      structureType: formData.category,
      weightKgEstimated: formData.steelWeightKg,
    });
  };

  const getActiveOrderPdfName = (): string => {
    const latestOrder = formData.productionOrders && formData.productionOrders.length > 0
      ? formData.productionOrders[formData.productionOrders.length - 1]
      : null;

    if (latestOrder?.pdfAttachment?.name) {
      return latestOrder.pdfAttachment.name;
    }
    if (formData.contractFiles && formData.contractFiles.length > 0) {
      return formData.contractFiles[0].name;
    }
    return `Projeto_Desenho_Tecnico_${formData.osNumber || formData.code}.pdf`;
  };
  
  // OS Modal / Form State
  const [isOsModalOpen, setIsOsModalOpen] = useState(false);
  const [osNumber, setOsNumber] = useState(formData.orderCode || formData.osNumber || formData.code);
  const [osColor, setOsColor] = useState(formData.color || 'Preto Fosco Eletrostático');
  const [osFootage, setOsFootage] = useState(formData.footage || '1.200 m²');
  const [osAssembler, setOsAssembler] = useState(formData.assemblerName || 'Mestre Valdemar Santos');
  const [osTeamId, setOsTeamId] = useState(formData.teamId || teams[0]?.id || '');
  const [osPriority, setOsPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>(formData.priority || 'alta');
  const [osStartDate, setOsStartDate] = useState(formData.startDate || new Date().toISOString().split('T')[0]);
  const [osDeadlineDate, setOsDeadlineDate] = useState(formData.deadlineDate || new Date().toISOString().split('T')[0]);
  const [osProducts, setOsProducts] = useState<ContractedProductItem[]>(
    formData.contractedProducts && formData.contractedProducts.length > 0 
      ? formData.contractedProducts 
      : [
          {
            id: `cp-${Date.now()}-1`,
            description: formData.title || 'Estrutura Metálica Principal',
            quantityTotal: 1,
            quantityDelivered: 0,
            unit: 'conjuntos',
            unitPrice: formData.contractedValue || 50000,
            totalPrice: formData.contractedValue || 50000,
            status: 'pendente'
          }
        ]
  );

  // New Checklist Item State
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  const statusMeta = STATUS_LABELS[formData.status] || STATUS_LABELS['nao_iniciada'];

  // Handle stage change with progress recalculation
  const handleStatusChange = (newStatus: WorkStatus) => {
    const newProgress = calculateProgressForStatus(newStatus);
    const updated = {
      ...formData,
      status: newStatus,
      progressPercent: newProgress,
      completionDate: newStatus === 'finalizada' ? new Date().toISOString().split('T')[0] : formData.completionDate,
    };
    setFormData(updated);
    onSave(updated);
  };

  // Checklist Actions
  const handleToggleChecklist = (id: string) => {
    const updated = (formData.checklist || []).map(item => {
      if (item.id === id) {
        return {
          ...item,
          checked: !item.checked,
          date: !item.checked ? new Date().toISOString().split('T')[0] : undefined,
          checkedBy: !item.checked ? 'Inspetor de Qualidade' : undefined,
        };
      }
      return item;
    });
    const updatedProject = { ...formData, checklist: updated };
    setFormData(updatedProject);
    onSave(updatedProject);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    const newItem: QualityChecklistItem = {
      id: `chk-${Date.now()}`,
      title: newChecklistTitle.trim(),
      checked: false,
    };
    const updatedProject = {
      ...formData,
      checklist: [...(formData.checklist || []), newItem],
    };
    setFormData(updatedProject);
    onSave(updatedProject);
    setNewChecklistTitle('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    const updatedProject = {
      ...formData,
      checklist: (formData.checklist || []).filter(c => c.id !== id),
    };
    setFormData(updatedProject);
    onSave(updatedProject);
  };

  // Create / Save OS
  const handleSaveOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!osNumber.trim()) return;

    const selectedTeam = teams.find(t => t.id === osTeamId);

    // Conforme especificado: Ao adicionar a OS ela deve entrar direto na etapa de ENTRADA (1. Ordem Pronta para Fábrica) com progresso da etapa
    const updatedProject: WorkProject = {
      ...formData,
      osNumber: osNumber.trim(),
      osCreatedAt: formData.osCreatedAt || new Date().toISOString().split('T')[0],
      color: osColor.trim(),
      footage: osFootage.trim(),
      assemblerName: osAssembler.trim(),
      teamId: osTeamId || undefined,
      teamName: selectedTeam ? selectedTeam.name : formData.teamName,
      priority: osPriority,
      startDate: osStartDate,
      deadlineDate: osDeadlineDate,
      contractedProducts: osProducts,
      status: 'entrada', // Entra direto na etapa 1 (Ordem Pronta para Fábrica)
      progressPercent: Math.max(formData.progressPercent || 0, calculateProgressForStatus('entrada')),
    };

    setFormData(updatedProject);
    onSave(updatedProject);
    setIsOsModalOpen(false);
  };

  // Add Product to OS
  const handleAddOsProduct = () => {
    const newItem: ContractedProductItem = {
      id: `cp-os-${Date.now()}`,
      description: 'Novo Componente / Perfil Fabril',
      quantityTotal: 1,
      quantityDelivered: 0,
      unit: 'm²',
      unitPrice: 200,
      totalPrice: 200,
      status: 'pendente',
    };
    setOsProducts([...osProducts, newItem]);
  };

  const handleUpdateOsProduct = (id: string, field: keyof ContractedProductItem, val: any) => {
    setOsProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: val };
        if (field === 'quantityTotal' || field === 'unitPrice') {
          updated.totalPrice = Number(updated.quantityTotal) * Number(updated.unitPrice);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleDeleteOsProduct = (id: string) => {
    setOsProducts(prev => prev.filter(p => p.id !== id));
  };

  // Print OS / Work Order summary
  const handlePrintOS = () => {
    window.print();
  };

  const checklistCheckedCount = (formData.checklist || []).filter(c => c.checked).length;
  const checklistTotalCount = (formData.checklist || []).length;
  const checklistProgress = checklistTotalCount > 0 ? Math.round((checklistCheckedCount / checklistTotalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-900/50">
                {formData.code}
              </span>
              {formData.orderCode && (
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  Ped: {formData.orderCode}
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusMeta.color} ${statusMeta.bg} ${statusMeta.darkBg} border ${statusMeta.border}`}>
                {statusMeta.label} ({formData.progressPercent}%)
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {formData.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {formData.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cliente: <span className="font-bold text-slate-900 dark:text-white">{formData.clientName}</span> | Comercial: <span className="font-medium">{formData.sellerName}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {/* EDITAR DADOS DA OBRA */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditWorkModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Editar Informações Cadastrais da Obra"
              >
                <Edit3 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Editar Dados da Obra</span>
              </button>
            )}

            {/* Visualizar Projeto Anexado / PDF */}
            <button
              type="button"
              onClick={() => {
                const url = getActiveOrderPdfUrl();
                setPdfViewerState({
                  isOpen: true,
                  url,
                  fileName: getActiveOrderPdfName(),
                  fileSizeBytes: 142000,
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Visualizar Projeto / Desenho Técnico Anexado a esta Ordem"
            >
              <Eye className="w-4 h-4 text-orange-600" />
              <span>Ver Projeto</span>
            </button>

            {/* CRIAR OS / EDITAR OS BUTTON */}
            <button
              onClick={() => setIsOsModalOpen(true)}
              id="btn-open-os-modal"
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{formData.osNumber ? 'Editar OS / Dados Fabris' : 'Criar OS'}</span>
            </button>

            <button
              onClick={handlePrintOS}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Imprimir Ficha de Obra / OS"
            >
              <Printer className="w-4 h-4" />
            </button>

            {canEdit && (
              <button
                onClick={() => {
                  const updatedIsArchived = !formData.isArchived;
                  const updated = {
                    ...formData,
                    isArchived: updatedIsArchived,
                    archivedAt: updatedIsArchived ? new Date().toISOString().split('T')[0] : undefined,
                  };
                  setFormData(updated);
                  onSave(updated);
                }}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  formData.isArchived
                    ? 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={formData.isArchived ? "Desarquivar / Reativar Obra" : "Arquivar Obra"}
              >
                {formData.isArchived ? <ArchiveRestore className="w-4 h-4 text-amber-600" /> : <Archive className="w-4 h-4" />}
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Excluir Obra Permanentemente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Stage Selector */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              Progresso Fabril & Campo: <span className="font-mono text-orange-600 dark:text-orange-400">{formData.progressPercent}%</span>
            </span>
            
            {/* Status Flow Buttons */}
            {canEdit && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Etapas:</span>
                {(['nao_iniciada', 'entrada', 'producao', 'acabamento', 'aguardando_entrega', 'instalacao', 'finalizada'] as WorkStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                      formData.status === st
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {STATUS_LABELS[st]?.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-600 transition-all duration-500 rounded-full"
              style={{ width: `${formData.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Navigation Submenu: Only General and Checklist de Qualidade */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('geral')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'geral'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dados da Obra & Ordem de Serviço (OS)</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'checklist'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Checklist de Qualidade ({checklistCheckedCount}/{checklistTotalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('historico_os')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'historico_os'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4 text-orange-600" />
            <span>Histórico de OS Geradas ({formData.productionOrders?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('contratos_pdf')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'contratos_pdf'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileCheck className="w-4 h-4 text-orange-600" />
            <span>Contratos & Anexos PDF ({formData.contractFiles?.length || 0})</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs space-y-4">
          
          {/* TAB 1: GERAL & ORDEM DE SERVIÇO */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              
              {/* Highlighted OS Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/80 via-white to-orange-50/40 dark:from-orange-950/30 dark:via-slate-900 dark:to-orange-950/20 border border-orange-200 dark:border-orange-900/50 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/60 dark:border-orange-900/40 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-orange-600/30">
                      OS
                    </div>
                    <div>
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
                        Ordem de Serviço Vinculada
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {formData.osNumber || 'Nenhuma OS emitida ainda'}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                    {/* Botão de Visualização Direta do Projeto da OS */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = getActiveOrderPdfUrl();
                        setPdfViewerState({
                          isOpen: true,
                          url,
                          fileName: getActiveOrderPdfName(),
                          fileSizeBytes: 142000,
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Visualizar Projeto / Desenho Técnico Anexado a esta Ordem"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar Projeto da OS</span>
                    </button>

                    <button
                      onClick={() => setIsOsModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{formData.osNumber ? 'Editar Parâmetros da OS' : 'Cadastrar / Emitir OS'}</span>
                    </button>
                  </div>
                </div>

                {/* OS Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cor / Pintura</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {formData.color || 'Não informada'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Metragem / Escopo</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono block">
                      {formData.footage || `${formData.contractedProducts?.length || 1} item(ns)`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Montador / Líder</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {formData.assemblerName || 'A definir'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Equipe de Montagem</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {formData.teamName || 'Definir na fábrica'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Início da Produção</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono block">
                      {formatDate(formData.startDate)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-orange-200 dark:border-orange-800/50">
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-semibold block">Entrega Estimada</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400 font-mono block">
                      {formatDate(formData.deadlineDate)}
                    </span>
                  </div>
                </div>

                {/* Banner de Anexo do Projeto da Ordem */}
                <div className="mt-3 pt-3 border-t border-orange-200/60 dark:border-orange-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Projeto Anexado:</span>
                        <span className="font-mono text-orange-600 dark:text-orange-400">{getActiveOrderPdfName()}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Desenho Fabril & Especificações Técnicas Oficiais da Ordem de Produção
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const url = getActiveOrderPdfUrl();
                      setPdfViewerState({
                        isOpen: true,
                        url,
                        fileName: getActiveOrderPdfName(),
                        fileSizeBytes: 142000,
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar Projeto na Tela</span>
                  </button>
                </div>
              </div>

              {/* Scope & Contracted Products List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-orange-600" />
                    Produtos & Escopo Cadastrado na Obra
                  </h3>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Total Contratado: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(formData.contractedValue)}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  {(formData.contractedProducts || []).map((prod, index) => (
                    <div 
                      key={prod.id || index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          {prod.description}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>Quantidade: <b className="text-slate-800 dark:text-slate-200">{prod.quantityTotal} {prod.unit}</b></span>
                          <span>Unitário: <b className="text-slate-800 dark:text-slate-200">{formatCurrency(prod.unitPrice)}</b></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(prod.totalPrice || (prod.quantityTotal * prod.unitPrice))}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          prod.status === 'entregue' ? 'bg-emerald-100 text-emerald-800' :
                          prod.status === 'em_entrega' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {prod.status === 'entregue' ? 'Entregue' : prod.status === 'em_entrega' ? 'Em Fabricação' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Overview Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Local de Instalação & Endereço
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {formData.address || 'Endereço a confirmar com o cliente'}
                  </p>
                  {formData.description && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Observações</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        "{formData.description}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-orange-600" />
                    Resumo Operacional
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Itens Contratados</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{formData.contractedProducts?.length || 1} item(ns)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Prioridade</span>
                      <span className="font-bold uppercase text-orange-600">{formData.priority}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CHECKLIST DE QUALIDADE (SUBMENU EXCLUSIVO MANTIDO) */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Checklist de Qualidade & Liberação Técnica
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Conferência de projetos, soldas, pintura, gabaritos e liberação de entrega
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                      {checklistProgress}% Aprovado
                    </span>
                  </div>
                </div>

                {/* Add new checklist item form */}
                {canEdit && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar novo item de verificação técnica..."
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklistItem(); }}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                )}

                {/* Checklist Items List */}
                <div className="space-y-2 pt-2">
                  {(formData.checklist || []).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => canEdit && handleToggleChecklist(item.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        item.checked
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          item.checked ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                        }`}>
                          {item.checked && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${item.checked ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {item.title}
                          </span>
                          {item.checked && item.date && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                              Verificado em {formatDate(item.date)} por {item.checkedBy || 'Inspetor'}
                            </span>
                          )}
                        </div>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveChecklistItem(item.id);
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTÓRICO DE ORDENS DE PRODUÇÃO (OS) */}
          {activeTab === 'historico_os' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/80 via-white to-orange-50/40 dark:from-orange-950/30 dark:via-slate-900 dark:to-orange-950/20 border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-600/30">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Histórico Geral de Ordens de Produção (OS)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Rastreabilidade de todas as ordens de serviço e lotes encaminhados à fábrica para esta obra.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    {formData.productionOrders?.length || 0} Ordens Emitidas
                  </span>
                </div>
              </div>

              {(!formData.productionOrders || formData.productionOrders.length === 0) ? (
                <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <Kanban className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
                  <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Nenhuma Ordem de Produção (OS) emitida ainda
                  </h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    As ordens de produção emitidas através da tela de Gestão de Obras ou do botão "Gerar Ordem" ficarão listadas e catalogadas aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.productionOrders.map((order, idx) => (
                    <div
                      key={order.id || idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-orange-300 dark:hover:border-orange-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          #{formData.productionOrders!.length - idx}
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              {order.osNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {order.status ? (STATUS_LABELS[order.status]?.label || order.status) : '0. Não Iniciada'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Emissão: {formatDate(order.issuedAt)}
                            </span>
                            {order.deadlineDate && (
                              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">
                                Prazo: {formatDate(order.deadlineDate)}
                              </span>
                            )}
                          </div>

                          <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span>{order.productDescription}</span>
                          </h5>

                          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                            <span>Lote a Produzir: <strong className="font-mono text-slate-900 dark:text-white font-bold">{order.quantity} {order.unit}</strong></span>
                            {order.paintColor && (
                              <span>Pintura: <strong>{order.paintColor}</strong></span>
                            )}
                            {order.assignedTeam && (
                              <span>Equipe/Líder: <strong>{order.assignedTeam}</strong></span>
                            )}
                          </div>

                          {order.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              "{order.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Visualizar PDF da OS */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = order.pdfAttachment?.fileDataUrl || generateProductionOrderDrawingPdfDataUrl({
                              osNumber: order.osNumber,
                              projectCode: order.projectCode || formData.code,
                              projectTitle: order.projectTitle || formData.title,
                              clientName: order.clientName || formData.clientName,
                              productDescription: order.productDescription,
                              quantity: order.quantity,
                              unit: order.unit,
                              issuedAt: order.issuedAt,
                              deadlineDate: order.deadlineDate,
                              paintColor: order.paintColor,
                              assignedTeam: order.assignedTeam,
                              notes: order.notes,
                              structureType: order.structureType,
                              weightKgEstimated: order.weightKgEstimated
                            });
                            setPdfViewerState({
                              isOpen: true,
                              url,
                              fileName: order.pdfAttachment?.name || `Desenho_Fabril_${order.osNumber}.pdf`,
                              fileSizeBytes: order.pdfAttachment?.sizeBytes || 128000
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Visualizar Desenho Técnico / PDF da OS no Navegador"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizar PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Imprimir Ficha Técnica desta OS"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTRATOS & ANEXOS PDF */}
          {activeTab === 'contratos_pdf' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-orange-600" />
                      Contratos Assinados & Documentos Técnicos da Obra
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Visualize instantaneamente os arquivos PDF cadastrados em tela sem precisar fazer download.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Visualizar Minuta Gerada */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = getContractPdfUrl();
                        setPdfViewerState({
                          isOpen: true,
                          url,
                          fileName: `Contrato_Obra_${formData.code}.pdf`,
                          fileSizeBytes: 145000
                        });
                      }}
                      className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar Minuta do Contrato</span>
                    </button>
                  </div>
                </div>

                {/* Upload Drop Zone */}
                {canEdit && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                    onDragLeave={() => setIsDraggingPdf(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(false);
                      handleUploadContractFile(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDraggingPdf
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-300 dark:border-slate-700 hover:border-orange-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Clique ou arraste novos arquivos PDF para anexar à obra
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Suporta arquivos .PDF, plantas baixas, contratos comerciais e ARTs
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleUploadContractFile(e.target.files)}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Attached Files List */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Arquivos Anexados ({formData.contractFiles?.length || 0})
                  </h4>

                  {(!formData.contractFiles || formData.contractFiles.length === 0) ? (
                    <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Nenhum arquivo customizado anexado ainda. Você pode visualizar a minuta gerada pelo sistema acima ou anexar o PDF assinado.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.contractFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-orange-300 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate" title={file.name}>
                                {file.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span>{formatBytes(file.sizeBytes)}</span>
                                <span>•</span>
                                <span>{formatDate(file.uploadedAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {/* Visualizar PDF no Navegador */}
                            <button
                              type="button"
                              onClick={() => {
                                setPdfViewerState({
                                  isOpen: true,
                                  url: file.fileDataUrl,
                                  fileName: file.name,
                                  fileSizeBytes: file.sizeBytes
                                });
                              }}
                              className="px-2.5 py-1.5 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="Visualizar este PDF diretamente na tela"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Visualizar</span>
                            </button>

                            {/* Download PDF */}
                            <button
                              type="button"
                              onClick={() => downloadFile(file.fileDataUrl, file.name)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Baixar arquivo"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete File */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDeleteContractFile(file.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir anexo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <span className="text-xs text-slate-500">
            Obra cadastrada em {formatDate(formData.createdAt)}
          </span>

          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* OS MODAL FORM (CRIAR OS / EMITIR ORDEM DE SERVIÇO) */}
      {/* ========================================================================= */}
      {isOsModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {formData.osNumber ? 'Editar Ordem de Serviço (OS)' : 'Criar Ordem de Serviço (OS)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ao salvar, a obra mudará para o status <b className="text-amber-600 dark:text-amber-400">"Entrada (0%)"</b>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOS} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* OS Number (Long text) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-orange-600" />
                  Número da OS (Texto Longo / Descritivo) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={osNumber}
                  onChange={(e) => setOsNumber(e.target.value)}
                  placeholder="Ex: OS-2026-089 / Fabricação de Galpão Industrial 1.200m² - Pórticos, Vigas e Terças"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Client & Seller (Read-only reference) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cliente Vinculado</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.clientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vendedor Responsável</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.sellerName}</span>
                </div>
              </div>

              {/* Color, Footage, Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Paintbrush className="w-3.5 h-3.5 text-slate-400" />
                    Cor / Acabamento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Preto Fosco Eletrostático"
                    value={osColor}
                    onChange={(e) => setOsColor(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                    Metragem / Dimensões *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1.200 m² ou 350m lineares"
                    value={osFootage}
                    onChange={(e) => setOsFootage(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioridade da OS
                  </label>
                  <select
                    value={osPriority}
                    onChange={(e) => setOsPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="media">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-orange-600" />
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={osStartDate}
                    onChange={(e) => setOsStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-orange-600" />
                    Data de Entrega *
                  </label>
                  <input
                    type="date"
                    required
                    value={osDeadlineDate}
                    onChange={(e) => setOsDeadlineDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-orange-600"
                  />
                </div>
              </div>

              {/* Assembler & Installation Team */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Montador Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Valdemar Santos (Líder)"
                    value={osAssembler}
                    onChange={(e) => setOsAssembler(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <HardHat className="w-3.5 h-3.5 text-slate-400" />
                    Equipe de Instalação *
                  </label>
                  <select
                    value={osTeamId}
                    onChange={(e) => setOsTeamId(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} (Líder: {t.leader})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* OS Products List */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-orange-600" />
                    Produtos & Quantidades da OS
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOsProduct}
                    className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {osProducts.map((p) => (
                    <div key={p.id} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={p.description}
                          onChange={(e) => handleUpdateOsProduct(p.id, 'description', e.target.value)}
                          className="w-full p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs"
                          placeholder="Descrição"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          value={p.quantityTotal}
                          onChange={(e) => handleUpdateOsProduct(p.id, 'quantityTotal', Number(e.target.value))}
                          className="w-full p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-center"
                          placeholder="Qtd"
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">{p.unit}</span>
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteOsProduct(p.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Emitir OS e Mover para Entrada (0%)</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Dedicated Edit Work Project Modal */}
      {isEditWorkModalOpen && (
        <EditWorkModal
          isOpen={isEditWorkModalOpen}
          onClose={() => setIsEditWorkModalOpen(false)}
          project={formData}
          onSave={(updated) => {
            setFormData(updated);
            onSave(updated);
            setIsEditWorkModalOpen(false);
          }}
          clients={clients}
          sellers={sellers}
          teams={teams}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Excluir Obra"
        message={`Deseja realmente excluir a obra "${formData.code} - ${formData.title}"? Esta ação removerá os registros da obra do sistema.`}
        confirmLabel="Sim, Excluir"
        confirmVariant="danger"
        onConfirm={() => {
          onDelete(formData.id);
          setIsDeleteModalOpen(false);
          handleClose();
        }}
        onClose={() => setIsDeleteModalOpen(false)}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* PDF Viewer Modal */}
      {pdfViewerState.isOpen && (
        <PdfViewerModal
          isOpen={pdfViewerState.isOpen}
          onClose={() => setPdfViewerState({ isOpen: false, url: null, fileName: '' })}
          pdfUrl={pdfViewerState.url}
          fileName={pdfViewerState.fileName}
          fileSizeBytes={pdfViewerState.fileSizeBytes}
        />
      )}

    </div>
  );
};
