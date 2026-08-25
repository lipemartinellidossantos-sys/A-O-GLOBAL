import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Kanban, 
  List, 
  Clock, 
  HardHat, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  AlertCircle,
  Building,
  User,
  ArrowRight,
  Hash,
  Paintbrush,
  Sparkles,
  Users,
  Calendar,
  FileText,
  Tag,
  Check,
  Eye,
  Download
} from 'lucide-react';
import { 
  WorkProject, 
  WorkStatus, 
  WorkCategory, 
  InstallationTeam,
  FactoryStageConfig,
  ContractAttachment,
  UserRole,
  SystemUser,
  Seller
} from '../types';
import { formatCurrency, formatDate, STATUS_LABELS, StorageService, calculateProgressForStatus } from '../services/storage';
import { PdfViewerModal } from './PdfViewerModal';
import { 
  generateProductionOrderDrawingPdfDataUrl, 
  generateSampleContractPdfDataUrl 
} from '../utils/pdfHelper';
import { Lock, ShieldAlert } from 'lucide-react';

interface ProductionKanbanViewProps {
  projects: WorkProject[];
  stages?: FactoryStageConfig[];
  teams?: InstallationTeam[];
  sellers?: Seller[];
  selectedSellerId?: string;
  onSelectSeller?: (sellerId: string) => void;
  onSelectProject: (project: WorkProject) => void;
  onOpenNewWorkModal: () => void;
  onUpdateProjectStatus: (projectId: string, newStatus: WorkStatus) => void;
  canEditProjects?: boolean;
  canChangeStatus?: boolean;
  canEditWork?: boolean;
  activeRole?: UserRole;
  currentUser?: SystemUser | null;
}

const DEFAULT_STAGE_STYLES: Record<string, { color: string; dot: string; headerBg: string }> = {
  nao_iniciada: { color: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400', headerBg: 'bg-slate-100 dark:bg-slate-900/60' },
  entrada: { color: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', headerBg: 'bg-amber-50 dark:bg-amber-950/30' },
  producao: { color: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', headerBg: 'bg-orange-50 dark:bg-orange-950/30' },
  furacao: { color: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500', headerBg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  solda: { color: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500', headerBg: 'bg-rose-50 dark:bg-rose-950/30' },
  jateamento: { color: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', headerBg: 'bg-purple-50 dark:bg-purple-950/30' },
  acabamento: { color: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', headerBg: 'bg-blue-50 dark:bg-blue-950/30' },
  aguardando_entrega: { color: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500', headerBg: 'bg-violet-50 dark:bg-violet-950/30' },
  instalacao: { color: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500', headerBg: 'bg-cyan-50 dark:bg-cyan-950/30' },
  montagem: { color: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500', headerBg: 'bg-teal-50 dark:bg-teal-950/30' },
  finalizada: { color: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', headerBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
};

export const ProductionKanbanView: React.FC<ProductionKanbanViewProps> = ({
  projects,
  stages,
  teams = [],
  sellers = [],
  selectedSellerId = '',
  onSelectSeller,
  onSelectProject,
  onOpenNewWorkModal,
  onUpdateProjectStatus,
  canEditProjects = true,
  canChangeStatus = true,
  canEditWork = true,
  activeRole = 'admin',
  currentUser,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedPriority, setSelectedPriority] = useState<string>('todas');
  const [internalSellerFilter, setInternalSellerFilter] = useState<string>(selectedSellerId || '');

  const effectiveSellerId = selectedSellerId || internalSellerFilter;

  const isVendedor = activeRole === 'vendedor';
  const isOrcamentista = activeRole === 'orcamentista';
  
  // Orçamentista e Vendedor possuem visualização somente leitura no fluxo de produção
  const isReadOnlyMode = isVendedor || isOrcamentista;
  const canCreate = !isReadOnlyMode && canEditProjects && canEditWork;
  const canModifyStatus = !isReadOnlyMode && canChangeStatus;

  // PDF Viewer Modal state
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

  const handleOpenProjectPdf = (project: WorkProject) => {
    // 1. Check if there are production orders with pdfAttachment
    const latestOrder = project.productionOrders && project.productionOrders.length > 0
      ? project.productionOrders[project.productionOrders.length - 1]
      : null;

    if (latestOrder?.pdfAttachment?.fileDataUrl) {
      setPdfViewerState({
        isOpen: true,
        url: latestOrder.pdfAttachment.fileDataUrl,
        fileName: latestOrder.pdfAttachment.name || `Desenho_Fabril_${latestOrder.osNumber}.pdf`,
        fileSizeBytes: latestOrder.pdfAttachment.sizeBytes,
      });
      return;
    }

    // 2. Check if project has contract/project files
    if (project.contractFiles && project.contractFiles.length > 0) {
      const file = project.contractFiles[0];
      setPdfViewerState({
        isOpen: true,
        url: file.fileDataUrl,
        fileName: file.name,
        fileSizeBytes: file.sizeBytes,
      });
      return;
    }

    // 3. Check if any contracted product has a drawing/PDF attached
    const productWithPdf = project.contractedProducts?.find(p => p.pdfAttachment?.fileDataUrl);
    if (productWithPdf?.pdfAttachment?.fileDataUrl) {
      setPdfViewerState({
        isOpen: true,
        url: productWithPdf.pdfAttachment.fileDataUrl,
        fileName: productWithPdf.pdfAttachment.name || `Desenho_${productWithPdf.description}.pdf`,
        fileSizeBytes: productWithPdf.pdfAttachment.sizeBytes,
      });
      return;
    }

    // 4. Fallback: generate drawing / OS technical drawing for this project
    const generatedUrl = generateProductionOrderDrawingPdfDataUrl({
      osNumber: project.osNumber || latestOrder?.osNumber || `OS-${project.code}`,
      projectCode: project.code,
      projectTitle: project.title,
      clientName: project.clientName,
      productDescription: project.contractedProducts?.[0]?.description || project.title,
      quantity: project.contractedProducts?.[0]?.quantityTotal || 1,
      unit: project.contractedProducts?.[0]?.unit || 'un',
      issuedAt: project.startDate || new Date().toISOString().split('T')[0],
      deadlineDate: project.deadlineDate,
      paintColor: project.color || 'Primer Epóxi',
      assignedTeam: project.teamName || project.assemblerName || 'Fábrica e Montagem',
      notes: project.description,
      structureType: project.category,
      weightKgEstimated: project.steelWeightKg,
    });

    setPdfViewerState({
      isOpen: true,
      url: generatedUrl,
      fileName: `Projeto_Desenho_Tecnico_${project.osNumber || project.code}.pdf`,
      fileSizeBytes: 142000,
    });
  };

  const canEdit = canEditProjects ?? canEditWork;

  // 1. Dynamic Factory Stages strictly configured in System Settings
  const dynamicStages = useMemo(() => {
    const rawList = stages && stages.length > 0 ? stages : StorageService.getFactoryStages();
    if (!rawList || rawList.length === 0) {
      return [
        { id: 'stage-1', name: '1. Ordem de Produção Pronta para Descer para Fábrica', order: 1, statusMapping: 'entrada' as WorkStatus, color: 'text-amber-700 dark:text-amber-300', dotColor: 'bg-amber-500', headerBg: 'bg-amber-50 dark:bg-amber-950/30', workersCount: 2 },
        { id: 'stage-2', name: '2. Corte, Guilhotina & Plasma', order: 2, statusMapping: 'producao' as WorkStatus, color: 'text-orange-700 dark:text-orange-300', dotColor: 'bg-orange-500', headerBg: 'bg-orange-50 dark:bg-orange-950/30', workersCount: 4 },
        { id: 'stage-3', name: '3. Gabaritagem & Solda Estrutural', order: 3, statusMapping: 'producao' as WorkStatus, color: 'text-rose-700 dark:text-rose-300', dotColor: 'bg-rose-500', headerBg: 'bg-rose-50 dark:bg-rose-950/30', workersCount: 6 },
        { id: 'stage-4', name: '4. Tratamento & Pintura Industrial', order: 4, statusMapping: 'acabamento' as WorkStatus, color: 'text-blue-700 dark:text-blue-300', dotColor: 'bg-blue-500', headerBg: 'bg-blue-50 dark:bg-blue-950/30', workersCount: 3 },
        { id: 'stage-5', name: '5. Separação & Expedição', order: 5, statusMapping: 'aguardando_entrega' as WorkStatus, color: 'text-purple-700 dark:text-purple-300', dotColor: 'bg-purple-500', headerBg: 'bg-purple-50 dark:bg-purple-950/30', workersCount: 2 },
        { id: 'stage-6', name: '6. Montagem em Campo / Instalação', order: 6, statusMapping: 'instalacao' as WorkStatus, color: 'text-cyan-700 dark:text-cyan-300', dotColor: 'bg-cyan-500', headerBg: 'bg-cyan-50 dark:bg-cyan-950/30', workersCount: 5 },
        { id: 'stage-7', name: '7. Obra Concluída & Entregue', order: 7, statusMapping: 'finalizada' as WorkStatus, color: 'text-emerald-700 dark:text-emerald-300', dotColor: 'bg-emerald-500', headerBg: 'bg-emerald-50 dark:bg-emerald-950/30', workersCount: 1 },
      ];
    }

    return [...rawList].sort((a, b) => a.order - b.order).map((st) => {
      const mapping = st.statusMapping || (st.id as WorkStatus);
      const defaultStyle = DEFAULT_STAGE_STYLES[mapping] || DEFAULT_STAGE_STYLES.producao;
      return {
        ...st,
        statusMapping: mapping,
        color: st.color || defaultStyle.color,
        dotColor: st.dotColor || defaultStyle.dot,
        headerBg: st.headerBg || defaultStyle.headerBg,
      };
    });
  }, [stages]);

  // Stage order list for next/prev step calculation
  const stageOrder = useMemo(() => {
    return dynamicStages.map(s => s.statusMapping);
  }, [dynamicStages]);

  // 2. High-Performance Memoized Filter (with seller selection & role restriction)
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // Compute effective seller ID and seller Name
    let targetSellerId: string | null = effectiveSellerId || null;
    let targetSellerName: string | null = null;

    if (targetSellerId) {
      const foundSeller = sellers.find(s => s.id === targetSellerId);
      if (foundSeller) {
        targetSellerName = foundSeller.name.toLowerCase();
      }
    } else if (isVendedor && currentUser) {
      const userEmail = (currentUser.email || '').toLowerCase();
      const userName = (currentUser.name || '').toLowerCase();
      const matchedSeller = sellers.find(s => 
        s.id === currentUser.id ||
        (s.email && s.email.toLowerCase() === userEmail) ||
        (s.name && (s.name.toLowerCase() === userName || userName.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(userName)))
      );

      targetSellerId = matchedSeller?.id || currentUser.id;
      targetSellerName = (matchedSeller?.name || currentUser.name || '').toLowerCase();
    }

    return projects.filter((project) => {
      if (project.isArchived) return false;

      // Seller filtering (when in vendedor role or when a seller is selected)
      if (targetSellerId || isVendedor) {
        if (targetSellerId) {
          const pSellerId = project.sellerId;
          const pSellerName = (project.sellerName || '').toLowerCase();

          const isSellerMatch = (
            pSellerId === targetSellerId ||
            (targetSellerName && (
              pSellerName === targetSellerName ||
              pSellerName.includes(targetSellerName) ||
              targetSellerName.includes(pSellerName)
            ))
          );

          if (!isSellerMatch) return false;
        }
      }
      
      const matchesSearch = !term ||
        project.title.toLowerCase().includes(term) ||
        project.code.toLowerCase().includes(term) ||
        (project.orderCode && project.orderCode.toLowerCase().includes(term)) ||
        (project.osNumber && project.osNumber.toLowerCase().includes(term)) ||
        project.clientName.toLowerCase().includes(term) ||
        (project.teamName && project.teamName.toLowerCase().includes(term));
      
      const matchesCategory = selectedCategory === 'todas' || project.category === selectedCategory;
      const matchesPriority = selectedPriority === 'todas' || project.priority === selectedPriority;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [projects, searchTerm, selectedCategory, selectedPriority, isVendedor, effectiveSellerId, currentUser, sellers]);

  // Next / Prev stage helpers
  const getNextStage = (current: WorkStatus): WorkStatus | null => {
    const idx = stageOrder.indexOf(current);
    if (idx >= 0 && idx < stageOrder.length - 1) {
      return stageOrder[idx + 1];
    }
    return null;
  };

  const getPrevStage = (current: WorkStatus): WorkStatus | null => {
    const idx = stageOrder.indexOf(current);
    if (idx > 0) {
      return stageOrder[idx - 1];
    }
    return null;
  };

  const selectedSellerObj = sellers.find(s => s.id === effectiveSellerId);

  return (
    <div className="space-y-4">
      {/* Vendedor Notification & Filter Banner */}
      {isVendedor && (
        <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900 dark:text-purple-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-sm text-purple-950 dark:text-purple-100">
                  Perfil Vendedor — Visualização Filtrada de Obras
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-[10px] font-bold text-purple-800 dark:text-purple-200">
                  Modo Somente Leitura
                </span>
              </div>
              <p className="mt-0.5 text-purple-800 dark:text-purple-300 text-xs leading-relaxed">
                Você pode selecionar o vendedor cadastrado no filtro para acompanhar o andamento fabril das obras correspondentes.
              </p>
            </div>
          </div>

          {/* Vendedor Dropdown inside Banner */}
          {sellers.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-1.5 shrink-0 self-start sm:self-center">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-purple-700 dark:text-purple-300">
                  Filtrar Vendedor
                </span>
                <select
                  id="select-kanban-seller-filter"
                  value={effectiveSellerId}
                  onChange={(e) => {
                    setInternalSellerFilter(e.target.value);
                    if (onSelectSeller) onSelectSeller(e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="">Todos os Vendedores</option>
                  {sellers.map((sel) => (
                    <option key={sel.id} value={sel.id}>
                      {sel.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orçamentista Notification Banner */}
      {isOrcamentista && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start sm:items-center gap-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-sm text-amber-950 dark:text-amber-100">
                Perfil Orçamentista — Consulta de Fluxo de Produção
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                Modo Somente Leitura
              </span>
            </div>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
              Você possui acesso de visualização ao Fluxo de Produção para verificar o andamento fabril das obras orçadas. A criação e alteração de etapas do fluxo fabril são de responsabilidade da Produção/Supervisão.
            </p>
          </div>
        </div>
      )}

      {/* Header Controls & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Kanban className="w-5 h-5 text-orange-600" />
              Fluxo Fabril & Esteira de Produção
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhamento visual em tempo real desde a Ordem de Produção Pronta até a Entrega Final
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                id="btn-kanban-mode"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Visualização Kanban"
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                id="btn-list-mode"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Visualização em Lista"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            {canCreate && (
              <button
                id="btn-new-work-from-kanban"
                onClick={onOpenNewWorkModal}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-orange-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Obra</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-kanban-search"
              placeholder="Buscar por código, pedido, OS, obra ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          {/* Category Filter */}
          <select
            id="select-filter-category"
            aria-label="Filtrar por Categoria"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
          >
            <option value="todas">Todas as Estruturas</option>
            <option value="Galpão Metálico">Galpão Metálico</option>
            <option value="Mezanino Estrutural">Mezanino Estrutural</option>
            <option value="Portão Industrial">Portão Industrial</option>
            <option value="Guarda-Corpo & Corrimão">Guarda-Corpo & Corrimão</option>
            <option value="Cobertura Metálica">Cobertura Metálica</option>
            <option value="Escada Metálica">Escada Metálica</option>
            <option value="Esquadrias de Aço">Esquadrias de Aço</option>
            <option value="Estrutura Especial">Estrutura Especial</option>
          </select>

          {/* Priority Filter */}
          <select
            id="select-filter-priority"
            aria-label="Filtrar por Prioridade"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
          >
            <option value="todas">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média / Normal</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* DYNAMIC KANBAN VIEW MODE */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4 items-start scrollbar-thin">
          {dynamicStages.map((stage) => {
            const stageProjects = filteredProjects.filter((p) => p.status === stage.statusMapping);
            const stageTotalValue = stageProjects.reduce((acc, p) => acc + (p.contractedValue || 0), 0);

            return (
              <div 
                key={stage.id}
                className="flex flex-col rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 min-h-[560px] w-76 sm:w-80 shrink-0"
              >
                {/* Column Header */}
                <div className={`p-3.5 rounded-t-2xl border-b border-slate-200 dark:border-slate-800 ${stage.headerBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate pr-1">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.dotColor}`} />
                      <h3 className={`text-xs font-black tracking-tight ${stage.color} truncate`} title={stage.name}>
                        {stage.name}
                      </h3>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-[10px] font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-xs shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                      {stageProjects.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {formatCurrency(stageTotalValue)}
                    </span>
                    {stage.workersCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {stage.workersCount} operários
                      </span>
                    )}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2.5 flex-1 space-y-3 overflow-y-auto max-h-[760px]">
                  {stageProjects.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-3 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl bg-white/40 dark:bg-slate-900/30">
                      <Kanban className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
                      <p className="text-[11px] font-medium">Nenhuma obra nesta etapa</p>
                    </div>
                  ) : (
                    stageProjects.map((project) => {
                      const prevStage = getPrevStage(project.status);
                      const nextStage = getNextStage(project.status);
                      const productsCount = project.contractedProducts?.length || 0;

                      return (
                        <div
                          key={project.id}
                          className="bg-white dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs hover:shadow-md hover:border-orange-400 dark:hover:border-orange-500/60 transition-all group flex flex-col justify-between cursor-pointer relative"
                          onClick={() => onSelectProject(project)}
                        >
                          <div>
                            {/* Card Top: Code & Badges */}
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600">
                                  {project.code}
                                </span>
                                {project.orderCode && (
                                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/60">
                                    {project.orderCode}
                                  </span>
                                )}
                              </div>

                              {project.priority === 'urgente' && (
                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  Urgente
                                </span>
                              )}
                              {project.priority === 'alta' && (
                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Alta
                                </span>
                              )}
                              {project.priority === 'media' && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                  Normal
                                </span>
                              )}
                            </div>

                            {/* Title & Client */}
                            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {project.title}
                            </h4>
                            
                            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 gap-1">
                              <span className="truncate flex items-center gap-1 font-medium">
                                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{project.clientName}</span>
                              </span>
                              {project.category && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 shrink-0">
                                  {project.category}
                                </span>
                              )}
                            </div>

                            {/* OS Number & Products Info & Direct View Project Button */}
                            <div className="mt-2 p-2 bg-amber-50/90 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/50 text-[10px] space-y-1.5">
                              <div className="flex items-center justify-between gap-1 text-amber-900 dark:text-amber-200 font-bold truncate">
                                <span className="truncate flex items-center gap-1.5">
                                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span className="truncate">{project.osNumber || (project.productionOrders?.length ? `${project.productionOrders.length} OS Ativa(s)` : `OS-${project.code}`)}</span>
                                </span>
                                {productsCount > 0 ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-200/70 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 shrink-0 font-mono">
                                    {productsCount} {productsCount === 1 ? 'item' : 'itens'}
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-200/70 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 shrink-0 font-mono">
                                    {project.category}
                                  </span>
                                )}
                              </div>

                              {/* Botão para Visualizar o Projeto Anexado nessa Ordem */}
                              <button
                                id={`btn-view-project-kanban-${project.id}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenProjectPdf(project);
                                }}
                                className="w-full py-1.5 px-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                title="Visualizar Projeto / Desenho Técnico Anexado a esta Ordem de Produção"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Visualizar Projeto Anexado</span>
                              </button>
                            </div>
                          </div>

                          {/* Middle Specs: Financial Value & Progress */}
                          <div className="my-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-medium">Valor Contrato:</span>
                              <span className="font-mono font-black text-slate-900 dark:text-white">
                                {formatCurrency(project.contractedValue)}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1 pt-0.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-medium">Andamento</span>
                                <span className="font-black text-orange-600 dark:text-orange-400 font-mono">
                                  {project.progressPercent}%
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300" 
                                  style={{ width: `${project.progressPercent}%` }} 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Deadline & Quick Stage Shift Controls */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatDate(project.deadlineDate)}</span>
                            </div>

                            {/* Stage move buttons or Read-Only indicator */}
                            {canModifyStatus ? (
                              <div className="flex items-center gap-1">
                                {prevStage && (
                                  <button
                                    title="Voltar para etapa anterior"
                                    onClick={() => onUpdateProjectStatus(project.id, prevStage)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Jump stage dropdown */}
                                <select
                                  aria-label="Mover para etapa"
                                  value={project.status}
                                  onChange={(e) => onUpdateProjectStatus(project.id, e.target.value as WorkStatus)}
                                  className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-1.5 py-1 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden max-w-[95px] truncate"
                                >
                                  {dynamicStages.map((st) => (
                                    <option key={st.id} value={st.statusMapping}>
                                      {st.name.replace(/^[0-9]+\.\s*/, '')}
                                    </option>
                                  ))}
                                </select>

                                {nextStage && (
                                  <button
                                    title="Avançar para a próxima etapa"
                                    onClick={() => onUpdateProjectStatus(project.id, nextStage)}
                                    className="px-2 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold transition-colors flex items-center gap-0.5 cursor-pointer shadow-xs"
                                  >
                                    <span className="text-[9px]">Avançar</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : isVendedor ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                <span>Somente Leitura</span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW MODE */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                <tr>
                  <th className="p-3.5">Código / Pedido</th>
                  <th className="p-3.5">Obra / OS</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Etapa do Fluxo</th>
                  <th className="p-3.5">Progresso</th>
                  <th className="p-3.5">Valor do Contrato</th>
                  <th className="p-3.5">Prazo Estimado</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProjects.map((p) => {
                  const stageConfig = dynamicStages.find(s => s.statusMapping === p.status);
                  const statusInfo = STATUS_LABELS[p.status] || STATUS_LABELS['nao_iniciada'];
                  return (
                    <tr 
                      key={p.id}
                      onClick={() => onSelectProject(p)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        <div>{p.code}</div>
                        {p.orderCode && <div className="text-[10px] text-orange-600 font-semibold">{p.orderCode}</div>}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-[240px]">
                        <div className="truncate">{p.title}</div>
                        {p.osNumber && <div className="text-[10px] text-slate-500 truncate font-normal">{p.osNumber}</div>}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <div className="font-semibold">{p.clientName}</div>
                        <div className="text-[10px] text-slate-400">{p.category}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusInfo.color} ${statusInfo.bg} ${statusInfo.darkBg} border ${statusInfo.border}`}>
                          {stageConfig ? stageConfig.name : statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-600 rounded-full" style={{ width: `${p.progressPercent}%` }} />
                          </div>
                          <span className="font-mono text-[10px] font-black text-slate-800 dark:text-slate-200">{p.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.contractedValue)}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                        {formatDate(p.deadlineDate)}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenProjectPdf(p)}
                            className="px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-600 hover:text-white text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 transition-colors font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            title="Visualizar Projeto / Desenho Técnico da OS"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Projeto</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectProject(p)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-[11px] cursor-pointer"
                          >
                            Ver Obra
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal for Project / OS Technical Drawings */}
      <PdfViewerModal
        isOpen={pdfViewerState.isOpen}
        onClose={() => setPdfViewerState(prev => ({ ...prev, isOpen: false }))}
        pdfUrl={pdfViewerState.url}
        fileName={pdfViewerState.fileName}
        fileSizeBytes={pdfViewerState.fileSizeBytes}
      />
    </div>
  );
};
