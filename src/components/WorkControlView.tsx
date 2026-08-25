import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  UploadCloud, 
  Eye, 
  Download, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  Layers, 
  Scale, 
  DollarSign, 
  Calendar, 
  User, 
  HardHat, 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  ArrowUpRight, 
  Percent, 
  AlertCircle,
  FileCheck,
  PackagePlus,
  RefreshCw,
  MoreVertical,
  SlidersHorizontal,
  FolderOpen,
  Kanban,
  Sparkles,
  Printer,
  Check,
  Send,
  X,
  Archive,
  ArchiveRestore,
  AlertTriangle,
  History,
  Edit3
} from 'lucide-react';
import { 
  WorkProject, 
  WorkStatus, 
  ContractedProductItem, 
  ProductionOrderItem,
  ContractAttachment, 
  Client, 
  Seller, 
  InstallationTeam,
  UserRole 
} from '../types';
import { formatCurrency, formatKg, formatDate, STATUS_LABELS } from '../services/storage';
import { generateSampleContractPdfDataUrl, downloadFile, formatBytes } from '../utils/pdfHelper';
import { PdfViewerModal } from './PdfViewerModal';
import { GenerateProductionOrderModal } from './GenerateProductionOrderModal';
import { ProductionOrdersHistoryModal } from './ProductionOrdersHistoryModal';
import { EditWorkModal } from './EditWorkModal';

interface WorkControlViewProps {
  projects: WorkProject[];
  clients: Client[];
  sellers: Seller[];
  teams: InstallationTeam[];
  onSaveProject: (project: WorkProject) => void;
  onDeleteProject?: (projectId: string) => void;
  onToggleArchiveProject?: (projectId: string) => void;
  onSelectProjectForDetail: (project: WorkProject) => void;
  onOpenNewWorkModal: () => void;
  onNavigateToProductionKanban?: (projectId?: string) => void;
  canEdit: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  activeRole?: UserRole;
}

export const WorkControlView: React.FC<WorkControlViewProps> = ({
  projects,
  clients,
  sellers,
  teams,
  onSaveProject,
  onDeleteProject,
  onToggleArchiveProject,
  onSelectProjectForDetail,
  onOpenNewWorkModal,
  onNavigateToProductionKanban,
  canEdit,
  canCreate = true,
  canDelete = true,
  activeRole = 'admin',
}) => {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [archiveFilter, setArchiveFilter] = useState<'ativas' | 'arquivadas' | 'todas'>('ativas');
  
  // Modal for delete confirmation
  const [projectToDelete, setProjectToDelete] = useState<WorkProject | null>(null);

  // Active expanded project for submenu management
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  
  // Active Submenu tab inside the expanded project
  const [activeSubTab, setActiveSubTab] = useState<'produtos' | 'contrato' | 'dados' | 'historico_os'>('produtos');

  // Dedicated Production Orders History Modal State
  const [historyModalProject, setHistoryModalProject] = useState<WorkProject | null>(null);

  // Dedicated Edit Work Modal State
  const [projectToEdit, setProjectToEdit] = useState<WorkProject | null>(null);

  // PDF Preview modal state
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfName, setPreviewPdfName] = useState<string>('');
  const [previewPdfSize, setPreviewPdfSize] = useState<number | undefined>(undefined);

  // New Contracted Product inline form state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdQty, setNewProdQty] = useState<number>(1);
  const [newProdUnit, setNewProdUnit] = useState<ContractedProductItem['unit']>('m²');
  const [newProdUnitPrice, setNewProdUnitPrice] = useState<number>(150);

  // Drag & Drop state
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OS Technical Sheet modal state
  const [osModalProject, setOsModalProject] = useState<WorkProject | null>(null);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);

  // Dedicated Generate Production Order Modal State
  const [prodOrderModalData, setProdOrderModalData] = useState<{
    isOpen: boolean;
    project: WorkProject | null;
    initialProductId?: string;
  }>({
    isOpen: false,
    project: null,
  });

  // Handler to open the dedicated Generate Production Order form
  const handleOpenGenerateProductionOrderModal = (project: WorkProject, productId?: string) => {
    setProdOrderModalData({
      isOpen: true,
      project,
      initialProductId: productId,
    });
  };

  // Handler when a Production Order is emitted from the dedicated form
  const handleSaveProductionOrder = (updatedProject: WorkProject, newOrder: ProductionOrderItem) => {
    onSaveProject(updatedProject);
    setOrderSuccessMessage(
      `Ordem de Produção ${newOrder.osNumber} gerada com sucesso! Lote de ${newOrder.quantity} ${newOrder.unit} de "${newOrder.productDescription}" descontado do saldo e enviado à Fábrica (Coluna: 0. Não Iniciada).`
    );
    setTimeout(() => setOrderSuccessMessage(null), 7000);
  };

  // Handler to Archive / Unarchive work
  const handleToggleArchive = (project: WorkProject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onToggleArchiveProject) {
      onToggleArchiveProject(project.id);
    } else {
      const isArchived = !project.isArchived;
      onSaveProject({
        ...project,
        isArchived,
        archivedAt: isArchived ? new Date().toISOString().split('T')[0] : undefined,
      });
    }
    setOrderSuccessMessage(
      project.isArchived 
        ? `Obra "${project.title}" restaurada e movida para Obras Ativas!` 
        : `Obra "${project.title}" arquivada com sucesso!`
    );
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  // Handler to Confirm Delete
  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    if (onDeleteProject) {
      onDeleteProject(projectToDelete.id);
    }
    setOrderSuccessMessage(`Obra "${projectToDelete.title}" excluída com sucesso.`);
    setTimeout(() => setOrderSuccessMessage(null), 5000);
    setProjectToDelete(null);
  };

  // Projects counts
  const activeProjectsCount = projects.filter(p => !p.isArchived).length;
  const archivedProjectsCount = projects.filter(p => p.isArchived).length;

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.orderCode && p.orderCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'todas' || p.category === categoryFilter;
    const matchesArchive = 
      archiveFilter === 'todas' || 
      (archiveFilter === 'arquivadas' ? Boolean(p.isArchived) : !p.isArchived);

    return matchesSearch && matchesStatus && matchesCategory && matchesArchive;
  });

  // Calculate high-level KPIs
  const totalContractedValue = projects.reduce((acc, p) => acc + (p.contractedValue || 0), 0);
  const activeWorksCount = projects.filter(p => !p.isArchived && p.status !== 'finalizada').length;
  const totalContractedWorks = projects.filter(p => !p.isArchived).length;
  // Obras contratadas que ainda não entraram em produção (planejamento, orçamento ou não iniciada sem OS em produção)
  const notInProductionWorks = projects.filter(
    p => !p.isArchived && (p.status === 'planejamento' || p.status === 'orcamento' || p.status === 'nao_iniciada' || !p.productionOrderGenerated)
  );


  // Helper to calculate product delivery progress
  const getProductDeliveryProgress = (products?: ContractedProductItem[]) => {
    if (!products || products.length === 0) return 0;
    const totalQty = products.reduce((acc, p) => acc + p.quantityTotal, 0);
    if (totalQty === 0) return 0;
    const deliveredQty = products.reduce((acc, p) => acc + p.quantityDelivered, 0);
    return Math.min(100, Math.round((deliveredQty / totalQty) * 100));
  };

  // Handler for uploading PDF files (Drag & Drop or Input File)
  const handleFileUpload = (files: FileList | null, project: WorkProject) => {
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
        documentTitle: `Contrato de Obra - ${project.code}`,
      };

      const updatedFiles = [...(project.contractFiles || []), newAttachment];
      const updatedProject: WorkProject = {
        ...project,
        contractFiles: updatedFiles,
      };

      onSaveProject(updatedProject);
    };

    reader.readAsDataURL(file);
  };

  // Handler for generating sample PDF contract if none uploaded
  const handleGenerateSampleContract = (project: WorkProject) => {
    const dataUrl = generateSampleContractPdfDataUrl({
      code: project.code,
      title: project.title,
      clientName: project.clientName,
      contractedValue: project.contractedValue,
      startDate: project.startDate,
      deadlineDate: project.deadlineDate,
      steelWeightKg: project.steelWeightKg,
      contractedProducts: project.contractedProducts,
    });

    const newAttachment: ContractAttachment = {
      id: `att-${Date.now()}`,
      name: `Contrato_Registrado_${project.code}.pdf`,
      sizeBytes: 145000, // ~145 KB
      uploadedAt: new Date().toISOString().split('T')[0],
      fileDataUrl: dataUrl,
      fileType: 'application/pdf',
      documentTitle: `Contrato Digital - ${project.title}`,
    };

    const updatedFiles = [...(project.contractFiles || []), newAttachment];
    onSaveProject({
      ...project,
      contractFiles: updatedFiles,
    });
  };

  // Handler for adding a new contracted product item
  const handleAddProduct = (project: WorkProject) => {
    if (!newProdDesc.trim() || newProdQty <= 0) return;

    const newItem: ContractedProductItem = {
      id: `prod-${Date.now()}`,
      description: newProdDesc.trim(),
      quantityTotal: Number(newProdQty),
      quantityDelivered: 0,
      unit: newProdUnit,
      unitPrice: Number(newProdUnitPrice),
      totalPrice: Number(newProdQty) * Number(newProdUnitPrice),
      status: 'pendente',
    };

    const updatedProducts = [...(project.contractedProducts || []), newItem];
    const newDeliveryPercent = getProductDeliveryProgress(updatedProducts);

    onSaveProject({
      ...project,
      contractedProducts: updatedProducts,
      progressPercent: Math.max(project.progressPercent, newDeliveryPercent),
    });

    setNewProdDesc('');
    setNewProdQty(1);
    setNewProdUnitPrice(150);
    setIsAddingProduct(false);
  };

  // Handler for updating product delivery check / incremental delivery
  const handleUpdateProductDelivery = (
    project: WorkProject,
    productId: string,
    delta: number | 'full'
  ) => {
    const updatedProducts = (project.contractedProducts || []).map((prod) => {
      if (prod.id === productId) {
        let newDelivered = prod.quantityDelivered;
        if (delta === 'full') {
          newDelivered = prod.quantityTotal;
        } else {
          newDelivered = Math.max(0, Math.min(prod.quantityTotal, prod.quantityDelivered + delta));
        }

        const isComplete = newDelivered >= prod.quantityTotal;
        const isPartial = newDelivered > 0 && !isComplete;

        return {
          ...prod,
          quantityDelivered: newDelivered,
          status: isComplete ? ('entregue' as const) : isPartial ? ('em_entrega' as const) : ('pendente' as const),
          deliveredAt: isComplete ? new Date().toISOString().split('T')[0] : prod.deliveredAt,
        };
      }
      return prod;
    });

    const newDeliveryPercent = getProductDeliveryProgress(updatedProducts);

    onSaveProject({
      ...project,
      contractedProducts: updatedProducts,
      progressPercent: Math.max(project.progressPercent, newDeliveryPercent),
    });
  };

  // Handler for deleting a contracted product
  const handleDeleteProduct = (project: WorkProject, productId: string) => {
    const updatedProducts = (project.contractedProducts || []).filter(p => p.id !== productId);
    onSaveProject({
      ...project,
      contractedProducts: updatedProducts,
    });
  };

  // Handler for deleting an attached contract
  const handleDeleteAttachment = (project: WorkProject, attachmentId: string) => {
    const updatedFiles = (project.contractFiles || []).filter(f => f.id !== attachmentId);
    onSaveProject({
      ...project,
      contractFiles: updatedFiles,
    });
  };

  // Handler for Generating Production Order for all products and inserting into Production Flow (Não Iniciada)
  const handleGenerateProductionOrderForProject = (project: WorkProject) => {
    const osBase = project.osNumber || `OS-${new Date().getFullYear()}-${project.code.replace(/\D/g, '') || Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    const updatedProducts: ContractedProductItem[] = (project.contractedProducts || []).map((prod, idx) => {
      const prodOs = prod.osNumber || `${osBase}-${String(idx + 1).padStart(2, '0')}`;
      return {
        ...prod,
        osNumber: prodOs,
        productionStatus: 'nao_iniciada', // Direto para a coluna não iniciada
        productionOrderGenerated: true,
        productionOrderGeneratedAt: prod.productionOrderGeneratedAt || today,
        weightKgEstimated: prod.weightKgEstimated || Math.round((project.steelWeightKg || 3000) / ((project.contractedProducts?.length) || 1)),
      };
    });

    const updatedProject: WorkProject = {
      ...project,
      status: 'nao_iniciada', // Inserido direto no Fluxo de Produção na coluna Não Iniciada
      osNumber: osBase,
      osCreatedAt: project.osCreatedAt || today,
      productionOrderGenerated: true,
      productionOrderGeneratedAt: today,
      productionOrderNotes: `Ordem de Produção ${osBase} gerada vinculando ${updatedProducts.length} produtos à fábrica.`,
      contractedProducts: updatedProducts,
    };

    onSaveProject(updatedProject);
    setOrderSuccessMessage(`Ordem de Produção ${osBase} gerada com sucesso! ${updatedProducts.length} produtos foram vinculados e inseridos no Fluxo de Produção (Coluna 0. Não Iniciada).`);
    setTimeout(() => setOrderSuccessMessage(null), 6000);
  };

  // Handler for Generating / Linking OS for a single product
  const handleGenerateProductionOrderForSingleProduct = (project: WorkProject, productId: string) => {
    const osBase = project.osNumber || `OS-${new Date().getFullYear()}-${project.code.replace(/\D/g, '') || Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    const updatedProducts: ContractedProductItem[] = (project.contractedProducts || []).map((prod, idx) => {
      if (prod.id === productId) {
        return {
          ...prod,
          osNumber: prod.osNumber || `${osBase}-${String(idx + 1).padStart(2, '0')}`,
          productionStatus: 'nao_iniciada',
          productionOrderGenerated: true,
          productionOrderGeneratedAt: today,
        };
      }
      return prod;
    });

    const updatedProject: WorkProject = {
      ...project,
      osNumber: osBase,
      productionOrderGenerated: true,
      productionOrderGeneratedAt: project.productionOrderGeneratedAt || today,
      contractedProducts: updatedProducts,
    };

    onSaveProject(updatedProject);
    setOrderSuccessMessage(`Produto vinculado à Ordem de Produção e inserido no Fluxo Fabril (Coluna Não Iniciada).`);
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Obras em Execução
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {activeWorksCount} <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">ativas</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Valor Total Contratado
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {formatCurrency(totalContractedValue)}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Obras Contratadas
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {totalContractedWorks} <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">cadastradas</span>
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
              {notInProductionWorks.length} aguardando produção
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Controle de Contratos
            </span>
            <span className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
              100% <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Digital</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Painel de Controle de Obras & Contratos
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Gestão de contratos PDF, lista de produtos contratados, entregas parciais e progresso em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {canCreate && (
            <button
              id="btn-new-work-control"
              onClick={onOpenNewWorkModal}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Obra</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-specific Info Banner for Encarregado de Obra */}
      {activeRole === 'lider_montagem' && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
          <HardHat className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Acesso Encarregado de Obra:</span> Você tem permissão para <strong>cadastrar novas obras</strong> e <strong>editar</strong> produtos, contratos e dados técnicos. A exclusão definitiva de obras é restrita ao Administrador Master.
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-center gap-2.5">
        {/* Archive Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setArchiveFilter('ativas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-1 md:flex-initial justify-center ${
              archiveFilter === 'ativas'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Obras Ativas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300">
              {activeProjectsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setArchiveFilter('arquivadas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-1 md:flex-initial justify-center ${
              archiveFilter === 'arquivadas'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arquivadas</span>
            {archivedProjectsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                {archivedProjectsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setArchiveFilter('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-1 md:flex-initial justify-center ${
              archiveFilter === 'todas'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Todas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {projects.length}
            </span>
          </button>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-works-control"
            type="text"
            placeholder="Buscar por código, pedido (ex: PED-2026), título ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar por Status da Obra"
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="todos">Todos os Status ({projects.length})</option>
              <option value="entrada">1. Entrada / Aprovado</option>
              <option value="producao">2. Corte & Solda</option>
              <option value="acabamento">3. Pintura & Acabamento</option>
              <option value="aguardando_entrega">4. Aguardando Entrega</option>
              <option value="instalacao">5. Em Instalação</option>
              <option value="finalizada">6. Entregue / Finalizada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List & Expandable Submenus */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma obra encontrada</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Ajuste os filtros de pesquisa ou cadastre uma nova obra.
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = expandedProjectId === project.id;
            const deliveryPercent = getProductDeliveryProgress(project.contractedProducts);
            const totalProductsCount = project.contractedProducts?.length || 0;
            const completedProductsCount = (project.contractedProducts || []).filter(p => p.status === 'entregue').length;
            const contractFilesCount = project.contractFiles?.length || 0;

            return (
              <div 
                key={project.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-xs transition-all overflow-hidden ${
                  isExpanded 
                    ? 'border-orange-500/80 ring-1 ring-orange-500/30' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Project Card Header / Summary Row */}
                <div 
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/40 dark:bg-slate-800/30"
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                >
                  {/* Left Column: Code, Title, Client */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-orange-600 mt-0.5"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono font-extrabold text-xs">
                          {project.orderCode ? `${project.code} • ${project.orderCode}` : project.code}
                        </span>
                        {project.isArchived && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Archive className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Arquivada</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                          {project.category}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          project.status === 'finalizada' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          project.status === 'instalacao' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          project.status === 'producao' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          project.status === 'nao_iniciada' ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {STATUS_LABELS[project.status]?.label || project.status}
                        </span>

                        {/* OS Status & Production Order Badge */}
                        {project.productionOrderGenerated ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Kanban className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>OS: {project.osNumber || project.orderCode || 'Ativa'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            OS Pendente
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {project.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {project.clientName}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Vendedor: {project.sellerName}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Prazo: {formatDate(project.deadlineDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Values & Real-time Progress Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 min-w-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                        Valor Contratado
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-white block font-mono">
                        {formatCurrency(project.contractedValue)}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                        {totalProductsCount} {totalProductsCount === 1 ? 'produto contratado' : 'produtos contratados'}
                      </span>
                    </div>

                    {/* Progress Indicator */}
                    <div className="w-full sm:w-44 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Progresso da Obra</span>
                        <span className="text-orange-600 dark:text-orange-400 font-mono">{project.progressPercent}%</span>
                      </div>
                      
                      {/* Visual Status Progress Bar */}
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${project.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
                        <span>Produtos: {completedProductsCount}/{totalProductsCount} entregues</span>
                        <span>{contractFilesCount} {contractFilesCount === 1 ? 'anexo' : 'anexos'}</span>
                      </div>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="flex items-center flex-wrap gap-1.5 self-start sm:self-center">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGenerateProductionOrderModal(project);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm shadow-orange-600/30 transition-all flex items-center gap-1.5"
                          title="Gerar Ordem de Produção (selecionar produtos e quantidades a entrar em fabricação)"
                        >
                          <Kanban className="w-3.5 h-3.5" />
                          <span>Gerar Ordem</span>
                        </button>
                      )}

                      {project.productionOrderGenerated && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToProductionKanban) {
                              onNavigateToProductionKanban(project.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                          title="Ver este projeto na esteira de produção Kanban"
                        >
                          <Kanban className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Fluxo</span>
                        </button>
                      )}

                      {/* Archive / Unarchive Button */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleArchive(project, e)}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            project.isArchived
                              ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                          title={project.isArchived ? "Restaurar / Desarquivar Obra para Obras Ativas" : "Arquivar Obra"}
                        >
                          {project.isArchived ? (
                            <>
                              <ArchiveRestore className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden sm:inline">Desarquivar</span>
                            </>
                          ) : (
                            <>
                              <Archive className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Arquivar</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete Button */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Excluir Obra Permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      )}

                      {/* View Production Orders History Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryModalProject(project);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="Ver Histórico de Ordens de Produção (OS) geradas para esta obra"
                      >
                        <History className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        <span>Histórico de OS</span>
                        {(project.productionOrders?.length || 0) > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                            {project.productionOrders?.length}
                          </span>
                        )}
                      </button>

                      {/* Edit Work Project Data Button */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToEdit(project);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-orange-200 dark:border-orange-900/60 cursor-pointer"
                          title="Editar Dados da Obra (Valores, Prazos, Cliente, Montador)"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                          <span>Editar</span>
                        </button>
                      )}

                      {/* Fast Detail Modal Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProjectForDetail(project);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Abrir Prontuário Completo"
                      >
                        <span>Abrir</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE SUBMENU SECTION */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 animate-in fade-in duration-150">
                    {/* Submenu Tabs Navigation */}
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('produtos')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          activeSubTab === 'produtos'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>1. Produtos & Itens Contratados ({totalProductsCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSubTab('contrato')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          activeSubTab === 'contrato'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>2. Contrato PDF & Anexos ({contractFilesCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSubTab('dados')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          activeSubTab === 'dados'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>3. Resumo Financeiro & Equipe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSubTab('historico_os')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          activeSubTab === 'historico_os'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>4. Histórico de OS ({project.productionOrders?.length || 0})</span>
                      </button>
                    </div>

                    {/* SUB-TAB 1: PRODUTOS CONTRATADOS & CHECKAGEM DE ENTREGA */}
                    {activeSubTab === 'produtos' && (
                      <div className="space-y-4">
                        {/* Production Order Integration Status Banner */}
                        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                          project.productionOrderGenerated
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              project.productionOrderGenerated
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              <Kanban className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                  Fluxo de Produção & Ordem de Serviço (OS)
                                </h4>
                                {project.productionOrderGenerated ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                    OS Ativa no Fluxo
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    Não Enviado à Fábrica
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                                {project.productionOrderGenerated
                                  ? `Ordem ${project.osNumber || 'OS-GERADA'} ativa com ${project.contractedProducts?.length || 0} produtos vinculados diretamente na coluna 0. Não Iniciada.`
                                  : 'Gere a Ordem de Produção para vincular cada produto desta obra e inseri-los direto na coluna Não Iniciada do fluxo fabril.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenGenerateProductionOrderModal(project)}
                                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm shadow-orange-600/30 flex items-center gap-1.5 transition-all"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Gerar Ordem de Produção (OS)</span>
                              </button>
                            )}

                            {project.productionOrderGenerated && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setOsModalProject(project)}
                                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                                  title="Visualizar e imprimir ficha técnica da Ordem de Produção"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Ficha da OS</span>
                                </button>

                                {onNavigateToProductionKanban && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToProductionKanban(project.id)}
                                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                                  >
                                    <Kanban className="w-3.5 h-3.5" />
                                    <span>Ir para Fluxo de Produção</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Deliveries Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <PackageCheck className="w-4 h-4 text-orange-600" />
                              Controle de Entregas dos Produtos Contratados
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              Dê baixa e atualize as quantidades já entregues em canteiro até dar o OK final (100%)
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold block">
                                Conclusão de Entrega
                              </span>
                              <span className="text-sm font-black text-orange-600 dark:text-orange-400 font-mono">
                                {deliveryPercent}% Concluído
                              </span>
                            </div>

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => setIsAddingProduct(true)}
                                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                                <span>Adicionar Produto</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Add Product Form */}
                        {isAddingProduct && (
                          <div className="bg-orange-50/70 dark:bg-orange-950/40 p-4 rounded-xl border border-orange-200 dark:border-orange-900/60 space-y-3 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-1 border-b border-orange-200 dark:border-orange-900/60">
                              <span className="text-xs font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                                <PackagePlus className="w-4 h-4 text-orange-600" />
                                Novo Item do Escopo Contratado
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsAddingProduct(false)}
                                className="text-slate-400 hover:text-slate-600 text-xs"
                              >
                                Cancelar
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                              <div className="sm:col-span-6">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Descrição do Produto / Estrutura
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Pórticos Principais em Viga W310x38.7 / Terças U 150x60"
                                  value={newProdDesc}
                                  onChange={(e) => setNewProdDesc(e.target.value)}
                                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Quantidade
                                </label>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="any"
                                  value={newProdQty}
                                  onChange={(e) => setNewProdQty(Number(e.target.value))}
                                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Unidade
                                </label>
                                <select
                                  value={newProdUnit}
                                  onChange={(e) => setNewProdUnit(e.target.value as ContractedProductItem['unit'])}
                                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium cursor-pointer"
                                >
                                  <option value="m²">m²</option>
                                  <option value="kg">kg</option>
                                  <option value="ton">ton</option>
                                  <option value="un">un</option>
                                  <option value="m">m</option>
                                  <option value="barras">barras</option>
                                  <option value="chapas">chapas</option>
                                  <option value="conjuntos">conjuntos</option>
                                  <option value="peças">peças</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Valor Unit. (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={newProdUnitPrice}
                                  onChange={(e) => setNewProdUnitPrice(Number(e.target.value))}
                                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-right font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAddProduct(project)}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                              >
                                Salvar Produto no Contrato
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Products Table */}
                        {(!project.contractedProducts || project.contractedProducts.length === 0) ? (
                          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <PackageCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Nenhum produto cadastrado no escopo desta obra ainda
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                              Clique em "Adicionar Produto" para registrar os itens contratados e gerenciar as entregas.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase">
                                  <th className="py-2.5 px-3">Descrição do Produto</th>
                                  <th className="py-2.5 px-3">Vínculo OS / Produção</th>
                                  <th className="py-2.5 px-3 text-center">Qtd. Contratada</th>
                                  <th className="py-2.5 px-3 text-center">Entregue</th>
                                  <th className="py-2.5 px-3 text-center">Progresso (%)</th>
                                  <th className="py-2.5 px-3 text-right">Valor Unit.</th>
                                  <th className="py-2.5 px-3 text-right">Total (R$)</th>
                                  <th className="py-2.5 px-3 text-center">Ações de Entrega</th>
                                  {canEdit && <th className="py-2.5 px-2 text-center w-10"></th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                                {project.contractedProducts.map((prod) => {
                                  const itemPercent = Math.min(100, Math.round((prod.quantityDelivered / prod.quantityTotal) * 100));
                                  const isDone = prod.quantityDelivered >= prod.quantityTotal;
                                  const prodOs = prod.osNumber || (project.productionOrderGenerated ? `${project.osNumber || 'OS'}` : null);

                                  return (
                                    <tr 
                                      key={prod.id} 
                                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                                        isDone ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                                      }`}
                                    >
                                      {/* Desc */}
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                          {isDone ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                          ) : (
                                            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                          )}
                                          <div>
                                            <span className="font-bold text-slate-900 dark:text-white block">
                                              {prod.description}
                                            </span>
                                            {prod.deliveredAt && (
                                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                Última entrega: {formatDate(prod.deliveredAt)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      {/* OS / Production Status & Partial Batches */}
                                      <td className="py-3 px-3">
                                        {(() => {
                                          const inProd = prod.quantityInProduction ?? (prod.productionOrderGenerated ? prod.quantityTotal : 0);
                                          const totalQty = prod.quantityTotal;
                                          const remainingToProduce = Math.max(0, totalQty - inProd);
                                          const prodPct = Math.min(100, Math.round((inProd / totalQty) * 100));
                                          const isFullyInProduction = inProd >= totalQty;

                                          return (
                                            <div className="space-y-1.5 min-w-[150px]">
                                              {/* Status Badge */}
                                              {inProd > 0 ? (
                                                <div className="space-y-1">
                                                  <div className="flex items-center justify-between text-[10px]">
                                                    <span className={`inline-flex items-center gap-1 font-bold ${
                                                      isFullyInProduction ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                                                    }`}>
                                                      {isFullyInProduction ? (
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                      ) : (
                                                        <Kanban className="w-3 h-3 text-amber-600" />
                                                      )}
                                                      {isFullyInProduction ? '100% em Produção (OK)' : `Em Produção: ${inProd}/${totalQty} ${prod.unit}`}
                                                    </span>
                                                    <span className="font-mono text-[9px] text-slate-500 font-bold">{prodPct}%</span>
                                                  </div>

                                                  {/* Mini Progress Bar */}
                                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                      className={`h-full rounded-full transition-all ${
                                                        isFullyInProduction ? 'bg-emerald-500' : 'bg-amber-500'
                                                      }`}
                                                      style={{ width: `${prodPct}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                  <Clock className="w-2.5 h-2.5" />
                                                  Pendente de OS
                                                </span>
                                              )}

                                              {/* Action button to generate OS or additional batch */}
                                              {canEdit && remainingToProduce > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleOpenGenerateProductionOrderModal(project, prod.id)}
                                                  className="w-full px-2 py-1 rounded-md bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                                                  title={`Gerar Ordem de Produção para o saldo restante de ${remainingToProduce} ${prod.unit}`}
                                                >
                                                  <Plus className="w-3 h-3 text-orange-600" />
                                                  <span>{inProd > 0 ? `+ Lote (${remainingToProduce} ${prod.unit})` : 'Gerar Ordem (OS)'}</span>
                                                </button>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </td>

                                      {/* Qtd Contratada */}
                                      <td className="py-3 px-3 text-center font-mono font-bold">
                                        {prod.quantityTotal} <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">{prod.unit}</span>
                                      </td>

                                      {/* Qtd Entregue */}
                                      <td className="py-3 px-3 text-center font-mono font-bold text-orange-600 dark:text-orange-400">
                                        {prod.quantityDelivered} <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">{prod.unit}</span>
                                      </td>

                                      {/* Progresso do Item */}
                                      <td className="py-3 px-3 text-center">
                                        <div className="w-28 mx-auto space-y-1">
                                          <div className="flex items-center justify-between text-[10px] font-bold">
                                            <span className={isDone ? 'text-emerald-600' : 'text-slate-600'}>
                                              {itemPercent}%
                                            </span>
                                            <span className="text-[9px] text-slate-600 dark:text-slate-300 uppercase">
                                              {isDone ? 'OK 100%' : 'Em andamento'}
                                            </span>
                                          </div>
                                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full transition-all ${
                                                isDone ? 'bg-emerald-500' : 'bg-orange-500'
                                              }`}
                                              style={{ width: `${itemPercent}%` }}
                                            />
                                          </div>
                                        </div>
                                      </td>

                                      {/* Valor Unit */}
                                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                        {formatCurrency(prod.unitPrice)}
                                      </td>

                                      {/* Total */}
                                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(prod.totalPrice || prod.quantityTotal * prod.unitPrice)}
                                      </td>

                                      {/* Ações de Entrega / Checkagem */}
                                      <td className="py-3 px-3 text-center">
                                        {canEdit ? (
                                          <div className="flex items-center justify-center gap-1">
                                            {/* +1 Increment */}
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateProductDelivery(project, prod.id, +1)}
                                              disabled={isDone}
                                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950 text-slate-700 dark:text-slate-200 hover:text-orange-600 rounded text-[10px] font-bold transition-colors disabled:opacity-40"
                                              title="Adicionar +1 unidade entregue"
                                            >
                                              +1
                                            </button>

                                            {/* +10 Increment */}
                                            {prod.quantityTotal >= 10 && (
                                              <button
                                                type="button"
                                                onClick={() => handleUpdateProductDelivery(project, prod.id, +10)}
                                                disabled={isDone}
                                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950 text-slate-700 dark:text-slate-200 hover:text-orange-600 rounded text-[10px] font-bold transition-colors disabled:opacity-40"
                                                title="Adicionar +10 unidades entregues"
                                              >
                                                +10
                                              </button>
                                            )}

                                            {/* OK 100% Total Delivery Button */}
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateProductDelivery(project, prod.id, 'full')}
                                              disabled={isDone}
                                              className={`px-2.5 py-1 rounded text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                                                isDone
                                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                              }`}
                                              title="Dar Baixa Total / Confirmar Entrega 100%"
                                            >
                                              <CheckCircle2 className="w-3 h-3" />
                                              <span>{isDone ? 'Concluído' : 'Dar OK'}</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                            {isDone ? 'Entregue' : `${itemPercent}%`}
                                          </span>
                                        )}
                                      </td>

                                      {/* Delete Item */}
                                      {canEdit && (
                                        <td className="py-3 px-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteProduct(project, prod.id)}
                                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                            title="Remover este item do contrato"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 2: CONTRATO PDF & ANEXOS */}
                    {activeSubTab === 'contrato' && (
                      <div className="space-y-4">
                        {/* Drag & Drop Upload Box */}
                        {canEdit && (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingFile(true);
                            }}
                            onDragLeave={() => setIsDraggingFile(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingFile(false);
                              handleFileUpload(e.dataTransfer.files, project);
                            }}
                            className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center ${
                              isDraggingFile
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40'
                                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-orange-400'
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept=".pdf,application/pdf"
                              onChange={(e) => handleFileUpload(e.target.files, project)}
                              className="hidden"
                            />

                            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3 shadow-xs">
                              <UploadCloud className="w-6 h-6" />
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              Anexar Contrato em PDF (Arrastar e Soltar ou Buscar)
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-md mt-1">
                              Arraste e solte o arquivo PDF aqui ou clique no botão abaixo para buscar nos seus arquivos.
                            </p>

                            <div className="flex items-center gap-2 mt-3.5">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Buscar PDF no Computador</span>
                              </button>

                              {(!project.contractFiles || project.contractFiles.length === 0) && (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateSampleContract(project)}
                                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-300/80 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                                >
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Gerar Contrato Padrão</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* List of Attached PDF Files */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-orange-600" />
                            Documentos & Contratos Vinculados
                          </h4>

                          {(!project.contractFiles || project.contractFiles.length === 0) ? (
                            <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Nenhum PDF de contrato anexado a esta obra
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                                Anexe o contrato assinado ou gere uma minuta digital para visualização e download.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {project.contractFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                      PDF
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                                        {file.name}
                                      </span>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                                        <span>{formatBytes(file.sizeBytes)}</span>
                                        <span>•</span>
                                        <span>Enviado em {formatDate(file.uploadedAt)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* VISUALIZAR PDF SEM FAZER DOWNLOAD */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewPdfUrl(file.fileDataUrl || generateSampleContractPdfDataUrl({
                                          code: project.code,
                                          title: project.title,
                                          clientName: project.clientName,
                                          contractedValue: project.contractedValue,
                                          startDate: project.startDate,
                                          deadlineDate: project.deadlineDate,
                                          steelWeightKg: project.steelWeightKg,
                                          contractedProducts: project.contractedProducts,
                                        }));
                                        setPreviewPdfName(file.name);
                                        setPreviewPdfSize(file.sizeBytes);
                                      }}
                                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-slate-800 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                      title="Visualizar PDF na tela sem baixar"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Visualizar</span>
                                    </button>

                                    {/* FAZER DOWNLOAD DO PDF */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const url = file.fileDataUrl || generateSampleContractPdfDataUrl({
                                          code: project.code,
                                          title: project.title,
                                          clientName: project.clientName,
                                          contractedValue: project.contractedValue,
                                          startDate: project.startDate,
                                          deadlineDate: project.deadlineDate,
                                          steelWeightKg: project.steelWeightKg,
                                          contractedProducts: project.contractedProducts,
                                        });
                                        downloadFile(url, file.name);
                                      }}
                                      className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                                      title="Fazer Download do PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Delete Attachment */}
                                    {canEdit && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAttachment(project, file.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                        title="Remover Anexo"
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
                    )}

                    {/* SUB-TAB 3: RESUMO FINANCEIRO & DADOS DA OBRA */}
                    {activeSubTab === 'dados' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            Margem & Indicadores Financeiros
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">Valor Contratado</span>
                              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                {formatCurrency(project.contractedValue)}
                              </span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">Custo Real Acumulado</span>
                              <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                                {formatCurrency(project.actualCost)}
                              </span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">Margem Bruta (R$)</span>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                {formatCurrency(project.contractedValue - project.actualCost)}
                              </span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">Margem Percentual</span>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                {(((project.contractedValue - project.actualCost) / project.contractedValue) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <HardHat className="w-4 h-4 text-orange-600" />
                            Canteiro & Montagem em Campo
                          </h4>

                          <div className="space-y-2">
                            <div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">Equipe Alocada</span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {project.teamName || 'Nenhuma equipe alocada'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">Endereço da Obra</span>
                              <span className="text-slate-700 dark:text-slate-300">
                                {project.address || 'Endereço não informado'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">Descrição Técnica</span>
                              <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                                {project.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* PROJECT MANAGEMENT ACTIONS CARD */}
                        <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                              <span>Gestão & Ações da Obra ({project.code})</span>
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {project.isArchived 
                                ? 'Esta obra está arquivada no sistema. Você pode restaurá-la para torná-la ativa novamente ou excluí-la.'
                                : 'Arquive a obra para organizá-la fora da listagem principal ou exclua-a permanentemente se necessário.'}
                            </p>
                          </div>

                          {canEdit && (
                            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                              {/* Edit Work Details */}
                              <button
                                type="button"
                                onClick={() => setProjectToEdit(project)}
                                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shadow-orange-600/30 cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Editar Dados da Obra</span>
                              </button>

                              {/* Toggle Archive */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleArchive(project, e)}
                                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  project.isArchived
                                    ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {project.isArchived ? (
                                  <>
                                    <ArchiveRestore className="w-4 h-4 text-amber-600" />
                                    <span>Desarquivar Obra</span>
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-4 h-4 text-slate-500" />
                                    <span>Arquivar Obra</span>
                                  </>
                                )}
                              </button>

                              {/* Delete Work */}
                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectToDelete(project);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Excluir Obra</span>
                                </button>
                              ) : (
                                <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Exclusão restrita ao Administrador Master</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 4: HISTÓRICO DE ORDENS DE PRODUÇÃO (OS) GERADAS */}
                    {activeSubTab === 'historico_os' && (
                      <div className="space-y-4">
                        {/* Top banner */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-sm shrink-0">
                              <History className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                Histórico de Ordens de Produção (OS)
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {project.productionOrders && project.productionOrders.length > 0
                                  ? `${project.productionOrders.length} ordens de produção emitidas para o fluxo fabril desta obra.`
                                  : 'Nenhuma ordem de produção emitida para o fluxo fabril ainda.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenGenerateProductionOrderModal(project)}
                                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Gerar Nova OS</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setHistoryModalProject(project)}
                              className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Abrir em Tela Cheia</span>
                            </button>
                          </div>
                        </div>

                        {/* Orders List */}
                        {!project.productionOrders || project.productionOrders.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                            <Kanban className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
                            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Nenhuma Ordem de Produção (OS) emitida ainda
                            </h5>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                              Clique em "Gerar Ordem" para selecionar produtos e liberar os primeiros lotes para fabricação na coluna Não Iniciada.
                            </p>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenGenerateProductionOrderModal(project)}
                                className="mt-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-600/30 inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Emitir Primeira Ordem de Produção</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {project.productionOrders.map((order, idx) => (
                              <div
                                key={order.id || idx}
                                className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-orange-400 dark:hover:border-orange-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                    #{project.productionOrders!.length - idx}
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono font-black text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                        {order.osNumber}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                        {order.status ? (STATUS_LABELS[order.status]?.label || order.status) : '0. Não Iniciada'}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        Emitida em: {formatDate(order.issuedAt)}
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

                                    <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 flex-wrap">
                                      <span>Lote: <strong className="font-mono text-slate-900 dark:text-white font-bold">{order.quantity} {order.unit}</strong></span>
                                      {order.paintColor && (
                                        <span>Pintura: <strong>{order.paintColor}</strong></span>
                                      )}
                                      {order.assignedTeam && (
                                        <span>Encarregado: <strong>{order.assignedTeam}</strong></span>
                                      )}
                                    </div>

                                    {order.notes && (
                                      <p className="text-[10px] text-slate-500 italic mt-0.5">
                                        "{order.notes}"
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                                    title="Imprimir Ficha desta OS"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>

                                  {onNavigateToProductionKanban && (
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToProductionKanban(project.id)}
                                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                    >
                                      <Kanban className="w-3.5 h-3.5" />
                                      <span>Ver no Fluxo</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PDF VIEWER MODAL (Visualizador sem Download) */}
      <PdfViewerModal
        isOpen={Boolean(previewPdfUrl)}
        onClose={() => setPreviewPdfUrl(null)}
        fileUrl={previewPdfUrl}
        fileName={previewPdfName}
        fileSizeBytes={previewPdfSize}
      />

      {/* FLOATING SUCCESS TOAST */}
      {orderSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 dark:text-emerald-700">
              Fluxo de Produção Atualizado
            </h5>
            <p className="text-xs font-medium mt-0.5 leading-snug">
              {orderSuccessMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOrderSuccessMessage(null)}
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* OS TECHNICAL SHEET / MODAL DA FICHA DE ORDEM DE PRODUÇÃO */}
      {osModalProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white">
                  <Kanban className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase tracking-wider">
                      Ficha de Ordem de Produção (OS)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 font-mono">
                      {osModalProject.osNumber || 'OS-FÁBRICA'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Obra: {osModalProject.code} — {osModalProject.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOsModalProject(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Technical Sheet Details */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Top Details Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Cliente</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">{osModalProject.clientName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Vendedor</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">{osModalProject.sellerName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Emissão da OS</span>
                  <span className="font-bold text-slate-900 dark:text-white block mt-0.5 font-mono">
                    {formatDate(osModalProject.productionOrderGeneratedAt || osModalProject.osCreatedAt || osModalProject.startDate)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Prazo de Entrega</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400 block mt-0.5 font-mono">
                    {formatDate(osModalProject.deadlineDate)}
                  </span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Peso Total Estimado</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{formatKg(osModalProject.steelWeightKg)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Cor / Pintura</span>
                  <span className="font-bold text-slate-900 dark:text-white">{osModalProject.paintColor || 'Padrão Fabril'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Status no Fluxo</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                    Coluna: 0. Não Iniciada
                  </span>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-2.5 flex items-center justify-between">
                  <span>Itens / Produtos Vinculados à Ordem de Produção</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold font-mono">
                    {osModalProject.contractedProducts?.length || 0} itens
                  </span>
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Item #</th>
                        <th className="py-2 px-3">OS Individual</th>
                        <th className="py-2 px-3">Descrição do Produto</th>
                        <th className="py-2 px-3 text-center">Qtd. Programada</th>
                        <th className="py-2 px-3 text-center">Unidade</th>
                        <th className="py-2 px-3 text-center">Status Produção</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(osModalProject.contractedProducts || []).map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {p.osNumber || `${osModalProject.osNumber || 'OS'}-${String(idx + 1).padStart(2, '0')}`}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p.description}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                            {p.quantityTotal}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 font-semibold">{p.unit}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              0. Não Iniciada
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures & Release Block */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 dark:border-slate-600 pb-8" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mt-2">
                    Planejamento & Controle da Produção (PCP)
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">Emissão e Liberação Técnica</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 dark:border-slate-600 pb-8" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mt-2">
                    Encarregado Geral de Fábrica
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">Recebimento e Execução Fabril</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Ordem inserida diretamente na coluna <strong className="text-slate-900 dark:text-white">0. Não Iniciada</strong>.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Imprimir OS</span>
                </button>

                {onNavigateToProductionKanban && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = osModalProject.id;
                      setOsModalProject(null);
                      onNavigateToProductionKanban(id);
                    }}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Kanban className="w-4 h-4" />
                    <span>Ver no Fluxo de Produção</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setOsModalProject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Generate Production Order Modal */}
      {prodOrderModalData.isOpen && prodOrderModalData.project && (
        <GenerateProductionOrderModal
          project={prodOrderModalData.project}
          initialProductId={prodOrderModalData.initialProductId}
          isOpen={prodOrderModalData.isOpen}
          onClose={() => setProdOrderModalData({ isOpen: false, project: null })}
          onSaveOrder={handleSaveProductionOrder}
          onNavigateToProductionKanban={onNavigateToProductionKanban}
        />
      )}

      {/* Production Orders History Modal */}
      {historyModalProject && (
        <ProductionOrdersHistoryModal
          isOpen={Boolean(historyModalProject)}
          onClose={() => setHistoryModalProject(null)}
          project={historyModalProject}
          onNavigateToProductionKanban={onNavigateToProductionKanban}
          onOpenGenerateOrderModal={(project, prodId) => {
            setHistoryModalProject(null);
            handleOpenGenerateProductionOrderModal(project, prodId);
          }}
          canEdit={canEdit}
        />
      )}

      {/* Dedicated Edit Work Project Modal */}
      {projectToEdit && (
        <EditWorkModal
          isOpen={Boolean(projectToEdit)}
          onClose={() => setProjectToEdit(null)}
          project={projectToEdit}
          onSave={(updated) => {
            onSaveProject(updated);
            setProjectToEdit(null);
          }}
          clients={clients}
          sellers={sellers}
          teams={teams}
        />
      )}

      {/* DELETE WORK CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Excluir Obra Permanentemente?
                </h3>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {projectToDelete.code} {projectToDelete.orderCode ? `• ${projectToDelete.orderCode}` : ''}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Você está prestes a excluir a obra <strong className="text-slate-900 dark:text-white">{projectToDelete.title}</strong> do cliente <strong className="text-slate-900 dark:text-white">{projectToDelete.clientName}</strong>.
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Valor Contratado:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(projectToDelete.contractedValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Produtos Contratados:</span>
                <span className="font-bold text-slate-900 dark:text-white">{projectToDelete.contractedProducts?.length || 0} itens</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ordens de Produção:</span>
                <span className="font-bold text-slate-900 dark:text-white">{projectToDelete.productionOrders?.length || 0} ordens emitidas</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
              <strong>Atenção:</strong> Esta ação é irreversível. Se você apenas deseja ocultar a obra da lista principal, recomendamos <strong>Arquivar a Obra</strong>.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Obra</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
