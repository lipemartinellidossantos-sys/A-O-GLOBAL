import React, { useState } from 'react';
import { 
  Users, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  Scale, 
  HardHat, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Flame,
  Info,
  ChevronUp,
  ChevronDown,
  Calendar,
  ClipboardList,
  Target,
  UserCheck,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Activity,
  Zap,
  Eye,
  Download,
  Kanban,
  FileText,
  PackageCheck,
  Boxes,
  Factory
} from 'lucide-react';
import { 
  FactoryStageConfig, 
  WorkProject, 
  WorkStatus, 
  InternalProductionTeam, 
  ProductionDailyLog,
  ProductionOrderItem 
} from '../types';
import { formatKg, formatCurrency, formatDate } from '../services/storage';
import { downloadFile, generateProductionOrderDrawingPdfDataUrl } from '../utils/pdfHelper';
import { PdfViewerModal } from './PdfViewerModal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { ConfirmModal } from './ConfirmModal';

interface InternalPerformanceViewProps {
  stages: FactoryStageConfig[];
  internalTeams: InternalProductionTeam[];
  productionLogs: ProductionDailyLog[];
  projects: WorkProject[];
  onUpdateStages: (stages: FactoryStageConfig[]) => void;
  onSaveInternalTeam: (team: InternalProductionTeam) => void;
  onDeleteInternalTeam: (teamId: string) => void;
  onSaveProductionLog: (log: ProductionDailyLog) => void;
  onDeleteProductionLog: (logId: string) => void;
  onSelectProject?: (project: WorkProject) => void;
}

export const InternalPerformanceView: React.FC<InternalPerformanceViewProps> = ({
  stages,
  internalTeams,
  productionLogs,
  projects,
  onUpdateStages,
  onSaveInternalTeam,
  onDeleteInternalTeam,
  onSaveProductionLog,
  onDeleteProductionLog,
  onSelectProject,
}) => {
  // Navigation tabs inside Internal Performance
  const [activeTab, setActiveTab] = useState<'indicadores' | 'equipes' | 'apontamentos' | 'etapas'>('indicadores');

  // Modals state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<InternalProductionTeam | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<InternalProductionTeam | null>(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<ProductionDailyLog | null>(null);

  const [isAddingStage, setIsAddingStage] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState('');
  const [editStageDesc, setEditStageDesc] = useState('');
  const [stageToDelete, setStageToDelete] = useState<FactoryStageConfig | null>(null);

  // PDF Viewer Modal State
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [viewingPdfTitle, setViewingPdfTitle] = useState<string>('');

  // New stage form state
  const [newStageName, setNewStageName] = useState('');
  const [newStageDesc, setNewStageDesc] = useState('');
  const [newStageWorkers, setNewStageWorkers] = useState<number>(2);
  const [newStageStatus, setNewStageStatus] = useState<WorkStatus>('producao');

  // New Team Form State
  const [teamName, setTeamName] = useState('');
  const [teamStageId, setTeamStageId] = useState(stages[0]?.id || 'stage-2');
  const [teamLeader, setTeamLeader] = useState('');
  const [teamMembersCount, setTeamMembersCount] = useState<number>(4);
  const [teamShift, setTeamShift] = useState<'1º Turno (07:00 - 17:00)' | '2º Turno (17:00 - 02:00)' | 'Geral'>('1º Turno (07:00 - 17:00)');
  const [teamDailyTarget, setTeamDailyTarget] = useState<number>(20);
  const [teamSpecialties, setTeamSpecialties] = useState('');

  // New Log Form State
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logTeamId, setLogTeamId] = useState(internalTeams[0]?.id || '');
  const [logProjectId, setLogProjectId] = useState(projects[0]?.id || '');
  const [logOsNumber, setLogOsNumber] = useState('');
  const [logPiecesProduced, setLogPiecesProduced] = useState<number>(15);
  const [logFootage, setLogFootage] = useState('');
  const [logHours, setLogHours] = useState<number>(8);
  const [logWorkersCount, setLogWorkersCount] = useState<number>(4);
  const [logQuality, setLogQuality] = useState<'aprovado' | 'retrabalho' | 'inspecao_pendente'>('aprovado');
  const [logNotes, setLogNotes] = useState('');

  // Filter for logs & orders
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('todos');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('todos');

  // -------------------------------------------------------------------------
  // AUTOMATIC CALCULATION OF PRODUCTION ORDERS (OS) THAT WENT TO FACTORY & FINISHED
  // -------------------------------------------------------------------------
  interface FactoryOrderEnriched extends ProductionOrderItem {
    projectTitle: string;
    clientTradeName: string;
    structureType?: string;
  }

  const allProductionOrders: FactoryOrderEnriched[] = projects.flatMap(p => {
    const list: FactoryOrderEnriched[] = [];
    const clientName = p.clientTradeName || p.clientName || 'Cliente';
    
    if (p.productionOrders && p.productionOrders.length > 0) {
      p.productionOrders.forEach(po => {
        list.push({
          ...po,
          projectTitle: p.title,
          clientTradeName: clientName,
          structureType: po.structureType || p.structureType || 'Estrutura Metálica'
        });
      });
    }

    if (p.contractedProducts) {
      p.contractedProducts.forEach(prod => {
        if (prod.productionOrders) {
          prod.productionOrders.forEach(po => {
            if (!list.some(item => item.id === po.id || (item.osNumber === po.osNumber && item.productId === po.productId))) {
              list.push({
                ...po,
                projectTitle: p.title,
                clientTradeName: clientName,
                structureType: po.structureType || prod.structureType || p.structureType || 'Item Metálico'
              });
            }
          });
        }
      });
    }
    return list;
  });

  // Total Orders that went to production (Ordens que desceram para produção)
  const totalOrdersIssued = allProductionOrders.length;

  // Completed Orders
  const totalOrdersCompleted = allProductionOrders.filter(
    o => o.status === 'finalizada' || o.isCompleted === true
  ).length;

  // In active production on shop floor
  const totalOrdersInProduction = allProductionOrders.filter(
    o => o.status === 'producao' || o.status === 'acabamento' || o.status === 'entrada'
  ).length;

  // Ready for delivery / install
  const totalOrdersReadyOrInstall = allProductionOrders.filter(
    o => o.status === 'aguardando_entrega' || o.status === 'instalacao'
  ).length;

  // Not started yet
  const totalOrdersPending = allProductionOrders.filter(
    o => o.status === 'nao_iniciada'
  ).length;

  // Automatic Completion Rate (%)
  const ordersCompletionRate = totalOrdersIssued > 0 
    ? Math.round((totalOrdersCompleted / totalOrdersIssued) * 100) 
    : 100;

  // Automatic Pieces Calculations from Orders
  const totalPiecesFromOrders = allProductionOrders.reduce((acc, o) => acc + (o.quantity || 1), 0);
  const totalPiecesCompletedFromOrders = allProductionOrders
    .filter(o => o.status === 'finalizada' || o.isCompleted === true)
    .reduce((acc, o) => acc + (o.quantity || 1), 0);

  // Aggregated Metrics
  const totalInternalWorkers = internalTeams.reduce((acc, t) => acc + (t.membersCount || 0), 0);
  const totalMonthlyPiecesProduced = internalTeams.reduce((acc, t) => acc + (t.monthlyProductionPieces || 0), 0);
  
  // Average productivity score
  const avgProductivityScore = internalTeams.length > 0 
    ? Math.round(internalTeams.reduce((acc, t) => acc + (t.productivityScore || 0), 0) / internalTeams.length) 
    : 95;

  // Daily target vs actual calculations (peças por dia)
  const totalDailyTargetPieces = internalTeams.reduce((acc, t) => acc + ((t.targetDailyPiecesPerWorker || 20) * (t.membersCount || 1)), 0);

  // Handle PDF view / download
  const handleViewOrderPdf = (order: FactoryOrderEnriched) => {
    if (order.pdfAttachment?.fileDataUrl) {
      setViewingPdfUrl(order.pdfAttachment.fileDataUrl);
      setViewingPdfTitle(`Ordem de Produção #${order.osNumber} - ${order.productDescription || 'Desenho Técnico'}`);
    } else {
      const fallbackUrl = generateProductionOrderDrawingPdfDataUrl({
        osNumber: order.osNumber,
        projectCode: order.projectCode || 'OBR',
        projectTitle: order.projectTitle,
        clientName: order.clientTradeName || order.clientName || 'Cliente',
        productDescription: order.productDescription || order.structureType || 'Peça Estrutural',
        quantity: order.quantity || 1,
        unit: order.unit || 'un',
        issuedAt: order.issuedAt || new Date().toISOString().split('T')[0],
        deadlineDate: order.deadlineDate,
        paintColor: order.paintColor,
        assignedTeam: order.assignedTeam,
        notes: order.notes,
        structureType: order.structureType,
        weightKgEstimated: order.weightKgEstimated || 0,
      });
      setViewingPdfUrl(fallbackUrl);
      setViewingPdfTitle(`Ordem de Produção #${order.osNumber} - Desenho Técnico`);
    }
  };

  const handleDownloadOrderPdf = (order: FactoryOrderEnriched) => {
    if (order.pdfAttachment?.fileDataUrl) {
      downloadFile(order.pdfAttachment.fileDataUrl, order.pdfAttachment.name || `Ordem_Producao_${order.osNumber}.pdf`);
    } else {
      const fallbackUrl = generateProductionOrderDrawingPdfDataUrl({
        osNumber: order.osNumber,
        projectCode: order.projectCode || 'OBR',
        projectTitle: order.projectTitle,
        clientName: order.clientTradeName || order.clientName || 'Cliente',
        productDescription: order.productDescription || order.structureType || 'Peça Estrutural',
        quantity: order.quantity || 1,
        unit: order.unit || 'un',
        issuedAt: order.issuedAt || new Date().toISOString().split('T')[0],
        deadlineDate: order.deadlineDate,
        paintColor: order.paintColor,
        assignedTeam: order.assignedTeam,
        notes: order.notes,
        structureType: order.structureType,
        weightKgEstimated: order.weightKgEstimated || 0,
      });
      downloadFile(fallbackUrl, `Ordem_Producao_${order.osNumber}.pdf`);
    }
  };

  // Group works by mapped status for stage view
  const getStageProjects = (stage: FactoryStageConfig): WorkProject[] => {
    if (!stage.statusMapping) {
      if (stage.order === 1) return projects.filter(p => p.status === 'nao_iniciada' || p.status === 'entrada');
      if (stage.order === 2 || stage.order === 3) return projects.filter(p => p.status === 'producao');
      if (stage.order === 4) return projects.filter(p => p.status === 'acabamento');
      if (stage.order === 5) return projects.filter(p => p.status === 'aguardando_entrega');
      return projects.filter(p => p.status === 'instalacao');
    }
    return projects.filter(p => p.status === stage.statusMapping);
  };

  // Adjust worker count for an internal team
  const handleUpdateTeamWorkerCount = (teamId: string, delta: number) => {
    const team = internalTeams.find(t => t.id === teamId);
    if (!team) return;
    const nextCount = Math.max(1, team.membersCount + delta);
    onSaveInternalTeam({
      ...team,
      membersCount: nextCount
    });
  };

  // Open Edit Team Modal
  const handleOpenEditTeam = (team: InternalProductionTeam) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamStageId(team.stageId);
    setTeamLeader(team.leader);
    setTeamMembersCount(team.membersCount);
    setTeamShift(team.shift);
    setTeamDailyTarget(team.targetDailyPiecesPerWorker || 20);
    setTeamSpecialties(team.specialties.join(', '));
    setIsTeamModalOpen(true);
  };

  // Open New Team Modal
  const handleOpenNewTeam = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamStageId(stages[0]?.id || 'stage-2');
    setTeamLeader('');
    setTeamMembersCount(4);
    setTeamShift('1º Turno (07:00 - 17:00)');
    setTeamDailyTarget(20);
    setTeamSpecialties('');
    setIsTeamModalOpen(true);
  };

  // Save Team
  const handleSaveTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamLeader.trim()) return;

    const targetStage = stages.find(s => s.id === teamStageId);
    const dailyTargetPieces = Math.max(1, Number(teamDailyTarget) || 20);
    const members = Math.max(1, Number(teamMembersCount) || 1);

    const savedTeam: InternalProductionTeam = {
      id: editingTeam ? editingTeam.id : `in-team-${Date.now()}`,
      name: teamName.trim(),
      stageId: teamStageId,
      stageName: targetStage?.name || 'Etapa Fabril',
      leader: teamLeader.trim(),
      membersCount: members,
      shift: teamShift,
      targetDailyPiecesPerWorker: dailyTargetPieces,
      targetMonthlyPieces: dailyTargetPieces * 22 * members,
      status: 'ativa',
      specialties: teamSpecialties.split(',').map(s => s.trim()).filter(Boolean),
      productivityScore: editingTeam ? editingTeam.productivityScore : 95,
      monthlyProductionPieces: editingTeam ? (editingTeam.monthlyProductionPieces || 0) : 0,
      currentAssignedWorkIds: editingTeam ? editingTeam.currentAssignedWorkIds : [],
    };

    onSaveInternalTeam(savedTeam);
    setIsTeamModalOpen(false);
  };

  // Delete Team Confirm
  const handleConfirmDeleteTeam = () => {
    if (!teamToDelete) return;
    onDeleteInternalTeam(teamToDelete.id);
    setTeamToDelete(null);
  };

  // Open New Log Modal
  const handleOpenNewLog = () => {
    const defaultTeam = internalTeams[0];
    const defaultProj = projects[0];
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogTeamId(defaultTeam?.id || '');
    setLogProjectId(defaultProj?.id || '');
    setLogOsNumber(defaultProj?.osNumber || defaultProj?.orderCode || '');
    setLogPiecesProduced(15);
    setLogFootage('');
    setLogHours(8);
    setLogWorkersCount(defaultTeam?.membersCount || 4);
    setLogQuality('aprovado');
    setLogNotes('');
    setIsLogModalOpen(true);
  };

  // Save Log
  const handleSaveLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const team = internalTeams.find(t => t.id === logTeamId);
    const proj = projects.find(p => p.id === logProjectId);
    if (!team || !proj) return;

    const piecesCount = Math.max(1, Number(logPiecesProduced) || 1);

    const newLog: ProductionDailyLog = {
      id: `log-${Date.now()}`,
      date: logDate,
      teamId: team.id,
      teamName: team.name,
      stageName: team.stageName,
      workProjectId: proj.id,
      workCode: proj.code,
      osNumber: logOsNumber.trim() || proj.osNumber || proj.code,
      clientName: proj.clientName,
      piecesProduced: piecesCount,
      footageProduced: logFootage.trim() || undefined,
      hoursWorked: Math.max(1, Number(logHours) || 8),
      workersCount: Math.max(1, Number(logWorkersCount) || team.membersCount),
      notes: logNotes.trim() || undefined,
      qualityStatus: logQuality,
      createdAt: `${logDate} ${new Date().toLocaleTimeString().slice(0, 5)}`
    };

    // Update team accumulated production in pieces
    const updatedTeam: InternalProductionTeam = {
      ...team,
      monthlyProductionPieces: (team.monthlyProductionPieces || 0) + newLog.piecesProduced,
    };
    onSaveInternalTeam(updatedTeam);

    onSaveProductionLog(newLog);
    setIsLogModalOpen(false);
  };

  // Delete Log Confirm
  const handleConfirmDeleteLog = () => {
    if (!logToDelete) return;
    onDeleteProductionLog(logToDelete.id);
    setLogToDelete(null);
  };

  // Stage editing handlers
  const handleStartEditStage = (stage: FactoryStageConfig) => {
    setEditingStageId(stage.id);
    setEditStageName(stage.name);
    setEditStageDesc(stage.description || '');
  };

  const handleSaveStageEdit = (stageId: string) => {
    if (!editStageName.trim()) return;
    const updated = stages.map(s => s.id === stageId ? {
      ...s,
      name: editStageName.trim(),
      description: editStageDesc.trim(),
    } : s);
    onUpdateStages(updated);
    setEditingStageId(null);
  };

  const handleAddStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    const newStage: FactoryStageConfig = {
      id: `stage-${Date.now()}`,
      name: newStageName.trim(),
      description: newStageDesc.trim() || 'Etapa personalizada do fluxo produtivo.',
      workersCount: Math.max(1, newStageWorkers),
      order: stages.length + 1,
      color: 'border-orange-300 text-orange-700 dark:text-orange-300',
      dotColor: 'bg-orange-500',
      statusMapping: newStageStatus,
      dailyCapacityKgPerWorker: 1000,
    };

    onUpdateStages([...stages, newStage]);
    setNewStageName('');
    setNewStageDesc('');
    setNewStageWorkers(2);
    setIsAddingStage(false);
  };

  const handleConfirmDeleteStage = () => {
    if (!stageToDelete) return;
    const updated = stages.filter(s => s.id !== stageToDelete.id).map((s, idx) => ({ ...s, order: idx + 1 }));
    onUpdateStages(updated);
    setStageToDelete(null);
  };

  // Chart data for teams
  const teamChartData = internalTeams.map(team => {
    return {
      name: team.name.replace(/Equipe de /, '').replace(/\(.*?\)/, '').trim(),
      produtividade: team.productivityScore || 90,
      operarios: team.membersCount || 1,
      ordensAlocadas: (team.currentAssignedWorkIds || []).length,
    };
  });

  // Bottleneck detection in teams
  const bottleneckTeams = internalTeams.filter(t => {
    const assignedCount = (t.currentAssignedWorkIds || []).length;
    return assignedCount > 3 || t.productivityScore < 85;
  });

  // Filtered production logs
  const filteredLogs = selectedTeamFilter === 'todos'
    ? productionLogs
    : productionLogs.filter(l => l.teamId === selectedTeamFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 shrink-0">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Desempenho Interno & Produtividade Fabril
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                Fábrica Ativa
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Controle das equipes do fluxo de produção, metas de peças por operário e diário de apontamentos de peças fabricadas no mês
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenNewLog}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Novo Apontamento de Produção</span>
          </button>

          <button
            onClick={handleOpenNewTeam}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>Nova Equipe Interna</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('indicadores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'indicadores'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Indicadores & Produtividade</span>
        </button>

        <button
          onClick={() => setActiveTab('equipes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'equipes'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipes do Fluxo ({internalTeams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('apontamentos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'apontamentos'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Diário de Apontamentos ({productionLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('etapas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'etapas'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Etapas do Fluxo ({stages.length})</span>
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ordens que Desceram para Produção */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Ordens na Fábrica</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {totalOrdersIssued} <span className="text-xs font-medium text-slate-500">OS emitidas</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {totalPiecesFromOrders.toLocaleString('pt-BR')} peças programadas
          </div>
        </div>

        {/* Ordens Finalizadas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Ordens Finalizadas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-baseline gap-2">
            <span>{totalOrdersCompleted}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              {ordersCompletionRate}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {totalPiecesCompletedFromOrders.toLocaleString('pt-BR')} peças concluídas & aprovadas
          </div>
        </div>

        {/* Em Fabricação Ativa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Em Fabricação Ativa</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalOrdersInProduction} <span className="text-xs font-medium text-slate-500">em esteira</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {totalOrdersReadyOrInstall} aguardando entrega/montagem
          </div>
        </div>

        {/* Global Efficiency & Workers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Produção no Mês</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {totalMonthlyPiecesProduced.toLocaleString('pt-BR')} <span className="text-xs font-medium text-slate-500">peças</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>{totalInternalWorkers} operários ({internalTeams.length} eq.)</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {totalDailyTargetPieces.toLocaleString('pt-BR')} peças/dia
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: INDICADORES & PRODUTIVIDADE */}
      {/* ========================================================================= */}
      {activeTab === 'indicadores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart: Productivity & Volume by Team */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Produtividade e Eficiência por Equipe Interna
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Acompanhamento de taxa de produtividade (%) e quadro de operários por equipe fabril
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-600" />
                    <span className="text-slate-600 dark:text-slate-400">Produtividade (%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-orange-600" />
                    <span className="text-slate-600 dark:text-slate-400">Operários</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamChartData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis 
                      dataKey="name" 
                      angle={-15} 
                      textAnchor="end" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      interval={0}
                    />
                    <YAxis yAxisId="left" domain={[0, 120]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar yAxisId="left" dataKey="produtividade" name="Produtividade %" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="operarios" name="Operários" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Smart Productivity Feedback */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black text-sm mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Diagnóstico das Equipes Internas</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O sistema cruza o número de operários alocados, meta diária de peças e os apontamentos de produção para otimizar o fluxo.
                </p>

                <div className="mt-4 space-y-2.5">
                  {bottleneckTeams.length > 0 ? (
                    bottleneckTeams.map(t => (
                      <div key={t.id} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs">
                        <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                          ⚠️ Atenção em {t.name}
                        </span>
                        <p className="text-[11px] text-amber-800 dark:text-amber-400">
                          {t.membersCount} operários na equipe. Considere remanejar +1 ajudante para acelerar a produção de peças.
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      ✓ Todas as equipes internas estão operando dentro da meta de produção de peças estipulada.
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Ritmo de Produção:</span>
                    <p className="text-[11px]">
                      Acompanhar o ritmo diário de peças concluídas por bancada garante que o cronograma de entrega das ordens de produção seja cumprido.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>Capacidade Atual:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {totalDailyTargetPieces.toLocaleString('pt-BR')} peças / dia útil
                </span>
              </div>
            </div>
          </div>

          {/* Ranking & Performance Summary Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span>Ranking de Produtividade & Peças Produzidas</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Comparativo detalhado da fabricação de peças por equipe interna
                </p>
              </div>
              <button
                onClick={handleOpenNewLog}
                className="px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 text-orange-700 dark:text-orange-300 text-xs font-bold transition-all"
              >
                + Apontar Produção
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[11px]">
                    <th className="pb-3">Equipe Interna</th>
                    <th className="pb-3">Etapa Fabril</th>
                    <th className="pb-3">Líder / Encarregado</th>
                    <th className="pb-3 text-center">Operários</th>
                    <th className="pb-3 text-right">Meta (peças/op/dia)</th>
                    <th className="pb-3 text-right">Capacidade Diária</th>
                    <th className="pb-3 text-right">Peças Produzidas no Mês</th>
                    <th className="pb-3 text-center">Produtividade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {internalTeams.map((team) => {
                    const dailyTarget = team.targetDailyPiecesPerWorker || 20;
                    const dailyCap = dailyTarget * (team.membersCount || 1);
                    return (
                      <tr key={team.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 pr-2 font-bold text-slate-900 dark:text-white">
                          {team.name}
                        </td>
                        <td className="py-3.5 pr-2 text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            {team.stageName}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-slate-700 dark:text-slate-200">
                          {team.leader}
                        </td>
                        <td className="py-3.5 pr-2 text-center">
                          <span className="font-black text-slate-900 dark:text-white">{team.membersCount}</span>
                        </td>
                        <td className="py-3.5 pr-2 text-right font-medium text-slate-600 dark:text-slate-300">
                          {dailyTarget} peças
                        </td>
                        <td className="py-3.5 pr-2 text-right font-bold text-slate-900 dark:text-white">
                          {dailyCap.toLocaleString('pt-BR')} peças
                        </td>
                        <td className="py-3.5 pr-2 text-right font-black text-orange-600 dark:text-orange-400">
                          {(team.monthlyProductionPieces || 0).toLocaleString('pt-BR')} peças
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black ${
                            team.productivityScore >= 95 
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                              : team.productivityScore >= 85
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}>
                            {team.productivityScore}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CÁLCULO AUTOMÁTICO DE ORDENS QUE DESCEM PARA PRODUÇÃO & FINALIZADAS */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Cálculo Automático do Fluxo de Ordens de Produção
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      Tempo Real
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Soma automática de todas as Ordens de Produção (OS) que desceram para a fábrica e foram concluídas
                  </p>
                </div>
              </div>

              {/* Status Filter for Orders */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filtrar:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-hidden"
                >
                  <option value="todos">Todas as Ordens ({allProductionOrders.length})</option>
                  <option value="finalizada">Concluídas / Finalizadas ({totalOrdersCompleted})</option>
                  <option value="producao">Em Produção ({totalOrdersInProduction})</option>
                  <option value="aguardando">Aguardando Entrega / Montagem ({totalOrdersReadyOrInstall})</option>
                  <option value="nao_iniciada">Não Iniciadas ({totalOrdersPending})</option>
                </select>
              </div>
            </div>

            {/* Performance Visual Stream Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Total Descido p/ Fábrica</span>
                <div className="text-xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
                  <span>{totalOrdersIssued}</span>
                  <span className="text-xs font-semibold text-slate-500">ordens</span>
                </div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 block">
                  Total: {totalPiecesFromOrders.toLocaleString('pt-BR')} peças
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">Ordens Finalizadas</span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 flex items-baseline gap-1.5">
                  <span>{totalOrdersCompleted}</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">({ordersCompletionRate}%)</span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 block">
                  Concluídas: {totalPiecesCompletedFromOrders.toLocaleString('pt-BR')} peças
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block mb-1">Em Andamento na Esteira</span>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300 flex items-baseline gap-1.5">
                  <span>{totalOrdersInProduction}</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">ordens</span>
                </div>
                <span className="text-[10px] text-blue-700 dark:text-blue-400 mt-1 block">
                  Corte, conformação & montagem
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1">Saldo a Concluir</span>
                <div className="text-xl font-black text-amber-700 dark:text-amber-300 flex items-baseline gap-1.5">
                  <span>{totalOrdersIssued - totalOrdersCompleted}</span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">ordens</span>
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 block">
                  {Math.max(0, totalPiecesFromOrders - totalPiecesCompletedFromOrders).toLocaleString('pt-BR')} peças pendentes
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Progresso Global do Fluxo de Produção</span>
                <span className="text-orange-600 dark:text-orange-400 font-mono">{ordersCompletionRate}% Concluído</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all" 
                  style={{ width: `${ordersCompletionRate}%` }} 
                  title={`Finalizadas: ${totalOrdersCompleted}`}
                />
                <div 
                  className="h-full bg-blue-500 transition-all" 
                  style={{ width: `${totalOrdersIssued > 0 ? (totalOrdersInProduction / totalOrdersIssued) * 100 : 0}%` }} 
                  title={`Em Produção: ${totalOrdersInProduction}`}
                />
                <div 
                  className="h-full bg-amber-400 transition-all" 
                  style={{ width: `${totalOrdersIssued > 0 ? (totalOrdersReadyOrInstall / totalOrdersIssued) * 100 : 0}%` }} 
                  title={`Aguardando Entrega: ${totalOrdersReadyOrInstall}`}
                />
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Concluídas</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-blue-500" /> Em Produção / Usinagem</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-amber-400" /> Prontas p/ Entrega</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-700" /> Pendentes</span>
              </div>
            </div>

            {/* Orders Stream Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[11px]">
                    <th className="pb-3">OS / Lote</th>
                    <th className="pb-3">Obra & Cliente</th>
                    <th className="pb-3">Produto & Tipo de Estrutura</th>
                    <th className="pb-3 text-right">Qtd de Peças</th>
                    <th className="pb-3">Equipe Fabril</th>
                    <th className="pb-3 text-center">Status no Fluxo</th>
                    <th className="pb-3 text-right">Desenho / PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {allProductionOrders
                    .filter(order => {
                      if (orderStatusFilter === 'finalizada') return order.status === 'finalizada' || order.isCompleted;
                      if (orderStatusFilter === 'producao') return order.status === 'producao' || order.status === 'acabamento' || order.status === 'entrada';
                      if (orderStatusFilter === 'aguardando') return order.status === 'aguardando_entrega' || order.status === 'instalacao';
                      if (orderStatusFilter === 'nao_iniciada') return order.status === 'nao_iniciada';
                      return true;
                    })
                    .map((order) => {
                      const isComplete = order.status === 'finalizada' || order.isCompleted;
                      return (
                        <tr key={`${order.id}-${order.osNumber}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 pr-2 font-mono font-bold text-orange-600 dark:text-orange-400">
                            #{order.osNumber}
                          </td>
                          <td className="py-3 pr-2">
                            <span className="font-bold text-slate-900 dark:text-white block">{order.projectTitle}</span>
                            <span className="text-[11px] text-slate-500">{order.clientTradeName}</span>
                          </td>
                          <td className="py-3 pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{order.productDescription || 'Peça Metálica'}</span>
                            <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded-sm">
                              {order.structureType || 'Estrutura'}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {order.quantity || 1} {order.unit || 'un'}
                            </span>
                          </td>
                          <td className="py-3 pr-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                              {order.assignedTeam || 'Fábrica Geral'}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isComplete
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : order.status === 'producao'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : order.status === 'aguardando_entrega'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {isComplete && <CheckCircle2 className="w-3 h-3" />}
                              {isComplete ? 'Finalizada' : order.status === 'producao' ? 'Em Produção' : order.status === 'aguardando_entrega' ? 'Pronta' : 'Aguardando'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleViewOrderPdf(order)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                title="Visualizar PDF / Desenho Técnico"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadOrderPdf(order)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                title="Baixar PDF da Ordem"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {allProductionOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        Nenhuma ordem de produção desceu para a fábrica ainda. Gere ordens dentro dos produtos das obras.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: EQUIPES DO FLUXO DE PRODUÇÃO (GESTÃO & ALOCAÇÃO) */}
      {/* ========================================================================= */}
      {activeTab === 'equipes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Gestão das Equipes Fabris & Alocação de Operários
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ajuste o quadro de operários de cada equipe interna para balancear a capacidade produtiva da linha
              </p>
            </div>
            <button
              onClick={handleOpenNewTeam}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Equipe Interna</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {internalTeams.map((team) => {
              const dailyTarget = team.targetDailyPiecesPerWorker || 20;
              const dailyCap = dailyTarget * (team.membersCount || 1);
              const assignedWorks = projects.filter(p => (team.currentAssignedWorkIds || []).includes(p.id) || p.teamId === team.id);

              return (
                <div
                  key={team.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-orange-400/50 transition-all"
                >
                  <div>
                    {/* Team Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[10px] font-bold">
                          {team.stageName}
                        </span>
                        <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                          {team.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                          <span>Líder: <strong className="text-slate-800 dark:text-slate-100">{team.leader}</strong></span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditTeam(team)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors"
                          title="Editar Equipe"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {internalTeams.length > 1 && (
                          <button
                            onClick={() => setTeamToDelete(team)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Excluir Equipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Worker Allocation Control */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                          Operários Alocados
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {team.shift}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateTeamWorkerCount(team.id, -1)}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-white">
                          {team.membersCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateTeamWorkerCount(team.id, 1)}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-orange-600 font-bold flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Team Metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block font-semibold">Meta / Operário</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {dailyTarget} peças/dia
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block font-semibold">Capacidade Equipe</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {dailyCap.toLocaleString('pt-BR')} peças/dia
                        </span>
                      </div>
                    </div>

                    {/* Specialties */}
                    {team.specialties && team.specialties.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {team.specialties.map((spec, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Works In Progress by this Team */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-1.5">
                      Obras / OS em Andamento ({assignedWorks.length})
                    </span>
                    {assignedWorks.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Nenhuma obra alocada nesta bancada</p>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {assignedWorks.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => onSelectProject && onSelectProject(p)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-pointer text-[11px] flex items-center justify-between transition-colors"
                          >
                            <div className="truncate mr-2">
                              <span className="font-bold text-slate-900 dark:text-white">{p.code}</span>
                              <span className="text-slate-500 ml-1">· {p.clientName}</span>
                            </div>
                            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 shrink-0">
                              {p.type || 'Estrutura'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: DIÁRIO DE APONTAMENTOS DE PRODUÇÃO */}
      {/* ========================================================================= */}
      {activeTab === 'apontamentos' && (
        <div className="space-y-4">
          {/* Header and Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Diário de Produção Fabril & Histórico de Apontamentos
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Registros diários de peças fabricadas por equipe, obra e OS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filtrar Equipe:</span>
                <select
                  value={selectedTeamFilter}
                  onChange={e => setSelectedTeamFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden"
                >
                  <option value="todos">Todas as Equipes ({productionLogs.length})</option>
                  {internalTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenNewLog}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Apontar Produção</span>
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold">Nenhum apontamento registrado ainda</p>
                <p className="text-xs mt-1">Clique em "Novo Apontamento de Produção" para registrar as peças produzidas no dia.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[11px]">
                      <th className="pb-3">Data / Registro</th>
                      <th className="pb-3">Equipe Fabril</th>
                      <th className="pb-3">Obra / OS</th>
                      <th className="pb-3">Cliente</th>
                      <th className="pb-3 text-right">Peças Fabricadas</th>
                      <th className="pb-3">Detalhamento / Peças</th>
                      <th className="pb-3 text-center">Horas</th>
                      <th className="pb-3 text-center">Qualidade</th>
                      <th className="pb-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {formatDate(log.date)}
                          </div>
                          <span className="text-[10px] text-slate-400">{log.createdAt}</span>
                        </td>
                        <td className="py-3.5 pr-2">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{log.teamName}</div>
                          <span className="text-[10px] text-slate-500">{log.stageName}</span>
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className="font-bold text-orange-600 dark:text-orange-400">{log.workCode}</span>
                          {log.osNumber && (
                            <span className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              OS: {log.osNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-2 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                          {log.clientName}
                        </td>
                        <td className="py-3.5 pr-2 text-right font-black text-slate-900 dark:text-white">
                          {(log.piecesProduced || 0).toLocaleString('pt-BR')} peças
                        </td>
                        <td className="py-3.5 pr-2 text-slate-600 dark:text-slate-300">
                          {log.footageProduced || '-'}
                        </td>
                        <td className="py-3.5 pr-2 text-center text-slate-700 dark:text-slate-300 font-semibold">
                          {log.hoursWorked}h ({log.workersCount} op)
                        </td>
                        <td className="py-3.5 pr-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.qualityStatus === 'aprovado'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : log.qualityStatus === 'retrabalho'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}>
                            {log.qualityStatus === 'aprovado' ? '✓ Aprovado' : log.qualityStatus === 'retrabalho' ? 'Retrabalho' : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setLogToDelete(log)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Excluir apontamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: ETAPAS DO FLUXO FABRIL (CONFIGURAÇÃO) */}
      {/* ========================================================================= */}
      {activeTab === 'etapas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Configuração das Colunas e Etapas do Fluxo de Produção
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Personalize os nomes, descrições e ordem das etapas industriais da fábrica
              </p>
            </div>
            <button
              onClick={() => setIsAddingStage(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Configurar Nova Etapa</span>
            </button>
          </div>

          {/* Add Stage Form Drawer */}
          {isAddingStage && (
            <div className="bg-white dark:bg-slate-900 border-2 border-orange-500/40 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Plus className="w-4 h-4 text-orange-600" />
                  <span>Configurar Nova Etapa de Produção</span>
                </div>
                <button
                  onClick={() => setIsAddingStage(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStageSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Etapa *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    placeholder="Ex: 4. Jateamento & Preparação"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operários Sugeridos *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStageWorkers}
                    onChange={e => setNewStageWorkers(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vínculo com Status da Obra
                  </label>
                  <select
                    value={newStageStatus}
                    onChange={e => setNewStageStatus(e.target.value as WorkStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-hidden"
                  >
                    <option value="entrada">Entrada / Orçamento</option>
                    <option value="producao">Corte, Solda & Fabricação</option>
                    <option value="acabamento">Pintura & Acabamento</option>
                    <option value="aguardando_entrega">Aguardando Entrega / Transporte</option>
                    <option value="instalacao">Instalação / Montagem em Campo</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/20"
                  >
                    Salvar Etapa
                  </button>
                </div>

                <div className="sm:col-span-12">
                  <input
                    type="text"
                    value={newStageDesc}
                    onChange={e => setNewStageDesc(e.target.value)}
                    placeholder="Descrição resumida das atividades desta etapa fabril..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-hidden"
                  />
                </div>
              </form>
            </div>
          )}

          {/* Stages List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stages.map((stage, index) => {
              const isEditing = editingStageId === stage.id;
              const stageProjects = getStageProjects(stage);

              return (
                <div
                  key={stage.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editStageName}
                          onChange={e => setEditStageName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-orange-500 bg-orange-50/50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                        />
                        <input
                          type="text"
                          value={editStageDesc}
                          onChange={e => setEditStageDesc(e.target.value)}
                          className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSaveStageEdit(stage.id)}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Salvar
                          </button>
                          <button
                            onClick={() => setEditingStageId(null)}
                            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor || 'bg-orange-500'}`} />
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {stage.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                            {stage.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditStage(stage)}
                            className="p-1 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
                            title="Editar Etapa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {stages.length > 2 && (
                            <button
                              onClick={() => setStageToDelete(stage)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                              title="Excluir Etapa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Obras vinculadas:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {stageProjects.length} obra(s)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE EQUIPE INTERNA */}
      {/* ========================================================================= */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingTeam ? 'Editar Equipe Interna' : 'Nova Equipe do Fluxo Fabril'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina o líder, número de operários e meta diária de peças produzidas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="Ex: Equipe de Corte e Guilhotina (Linha A)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Etapa do Fluxo Fabril *
                  </label>
                  <select
                    value={teamStageId}
                    onChange={e => setTeamStageId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Líder / Encarregado *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamLeader}
                    onChange={e => setTeamLeader(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Prado"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operários *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={teamMembersCount}
                    onChange={e => setTeamMembersCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Meta (peças/op/dia) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={teamDailyTarget}
                    onChange={e => setTeamDailyTarget(Number(e.target.value))}
                    placeholder="Ex: 25"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Turno de Trabalho
                  </label>
                  <select
                    value={teamShift}
                    onChange={e => setTeamShift(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="1º Turno (07:00 - 17:00)">1º Turno (07h-17h)</option>
                    <option value="2º Turno (17:00 - 02:00)">2º Turno (17h-02h)</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Especialidades & Máquinas (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={teamSpecialties}
                  onChange={e => setTeamSpecialties(e.target.value)}
                  placeholder="Ex: Corte Plasma CNC, Guilhotina 1/2, Serra Fita"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all"
                >
                  {editingTeam ? 'Salvar Alterações' : 'Cadastrar Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO APONTAMENTO DE PRODUÇÃO */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Novo Apontamento de Produção
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registre a quantidade de peças produzidas pela equipe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLogSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Produção *
                  </label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Equipe Interna *
                  </label>
                  <select
                    value={logTeamId}
                    onChange={e => {
                      const id = e.target.value;
                      setLogTeamId(id);
                      const t = internalTeams.find(item => item.id === id);
                      if (t) setLogWorkersCount(t.membersCount);
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  >
                    {internalTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Obra Relacionada *
                  </label>
                  <select
                    value={logProjectId}
                    onChange={e => {
                      const pId = e.target.value;
                      setLogProjectId(pId);
                      const p = projects.find(item => item.id === pId);
                      if (p) setLogOsNumber(p.osNumber || p.orderCode || '');
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.clientName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número da Ordem de Serviço (OS)
                  </label>
                  <input
                    type="text"
                    value={logOsNumber}
                    onChange={e => setLogOsNumber(e.target.value)}
                    placeholder="Ex: OS-2026-045-A"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peças Produzidas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={logPiecesProduced}
                    onChange={e => setLogPiecesProduced(Number(e.target.value))}
                    placeholder="Ex: 50"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horas Trabalhadas
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={logHours}
                    onChange={e => setLogHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operários no Dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={logWorkersCount}
                    onChange={e => setLogWorkersCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Detalhamento das Peças
                  </label>
                  <input
                    type="text"
                    value={logFootage}
                    onChange={e => setLogFootage(e.target.value)}
                    placeholder="Ex: 8 vigas W, 20 pilares, 12 tesouras..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Inspeção de Qualidade
                  </label>
                  <select
                    value={logQuality}
                    onChange={e => setLogQuality(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="aprovado">✓ 100% Aprovado (Conforme)</option>
                    <option value="inspecao_pendente">Aguardando Ensaio / Medição</option>
                    <option value="retrabalho">Retrabalho / Correção</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Técnicas / Ocorrências
                </label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="Ex: Troca de bico do plasma, solda com eletrodo E7018 concluída sem porosidade..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all"
                >
                  Salvar Apontamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!teamToDelete}
        title={`Excluir Equipe "${teamToDelete?.name}"?`}
        message="Esta equipe interna será removida do fluxo. Os apontamentos históricos e as obras não serão apagados."
        confirmLabel="Sim, Excluir Equipe"
        onConfirm={handleConfirmDeleteTeam}
        onClose={() => setTeamToDelete(null)}
      />

      <ConfirmModal
        isOpen={!!logToDelete}
        title="Excluir Registro de Apontamento?"
        message={`Deseja excluir o apontamento de ${(logToDelete?.piecesProduced || 0).toLocaleString('pt-BR')} peças da equipe ${logToDelete?.teamName}?`}
        confirmLabel="Sim, Excluir Apontamento"
        onConfirm={handleConfirmDeleteLog}
        onClose={() => setLogToDelete(null)}
      />

      <ConfirmModal
        isOpen={!!stageToDelete}
        title={`Excluir Etapa "${stageToDelete?.name}"?`}
        message="Ao remover esta etapa, a ordem do fluxo fabril será recalculada."
        confirmLabel="Sim, Excluir Etapa"
        onConfirm={handleConfirmDeleteStage}
        onClose={() => setStageToDelete(null)}
      />

      {/* PDF Technical Drawing Viewer Modal */}
      {viewingPdfUrl && (
        <PdfViewerModal
          isOpen={true}
          onClose={() => setViewingPdfUrl(null)}
          pdfUrl={viewingPdfUrl}
          title={viewingPdfTitle || 'Ordem de Produção - Desenho Técnico'}
        />
      )}
    </div>
  );
};
