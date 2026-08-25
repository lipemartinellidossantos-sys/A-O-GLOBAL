import React from 'react';
import { 
  FolderPlus, 
  Hammer, 
  Truck, 
  HardHat, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  AlertTriangle, 
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Building2,
  Layers,
  Activity,
  Package,
  ClipboardList,
  Flame,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { 
  WorkProject, 
  FinancialTransaction, 
  WorkStatus, 
  UserRole 
} from '../types';
import { formatCurrency, formatDate, STATUS_LABELS } from '../services/storage';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

interface DashboardViewProps {
  projects: WorkProject[];
  transactions: FinancialTransaction[];
  onSelectProject: (project: WorkProject) => void;
  onNavigateToTab: (tab: any) => void;
  onOpenNewWorkModal: () => void;
  canEditProjects: boolean;
  canViewFinancial: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  transactions,
  onSelectProject,
  onNavigateToTab,
  onOpenNewWorkModal,
  canEditProjects,
  canViewFinancial,
}) => {
  // Real-time KPI calculations
  const totalProjectsCount = projects.length;
  
  // Specific status counts:
  // Obras contratadas aguardando entrar em produção
  const contratadasAguardandoCount = projects.filter(
    p => p.status === 'nao_iniciada' || p.status === 'entrada'
  ).length;

  // Obras em fabricação fabril (corte, solda, acabamento, pintura)
  const emFabricacaoCount = projects.filter(
    p => p.status === 'producao' || p.status === 'solda' || p.status === 'jateamento' || p.status === 'acabamento'
  ).length;

  // Obras aguardando entrega / expedição
  const aguardandoEntregaCount = projects.filter(p => p.status === 'aguardando_entrega').length;

  // Obras em montagem / campo
  const instalacaoCount = projects.filter(p => p.status === 'instalacao').length;

  // Obras finalizadas
  const finalizadasCount = projects.filter(p => p.status === 'finalizada').length;

  // Obras ativas totais
  const activeProjects = projects.filter(p => p.status !== 'finalizada');
  const activeProjectsCount = activeProjects.length;

  // Total de produtos/peças contratadas no portfólio ativo
  const totalActiveProductsCount = activeProjects.reduce(
    (sum, p) => sum + (p.contractedProducts?.length || 1), 0
  );

  // Média de progresso das obras em andamento
  const avgActiveProgress = activeProjectsCount > 0
    ? Math.round(activeProjects.reduce((sum, p) => sum + (p.progressPercent || 0), 0) / activeProjectsCount)
    : 0;

  // Financial calculations strictly on project value & receipts
  const totalContractedValue = projects.reduce((acc, p) => acc + (p.contractedValue || 0), 0);

  const totalReceived = transactions
    .filter(t => t.type === 'receita' && t.status === 'pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPendingReceivable = Math.max(0, totalContractedValue - totalReceived);

  // Valor das obras contratadas que ainda não entraram em fabricação
  const valueAguardandoProducao = projects
    .filter(p => p.status === 'nao_iniciada' || p.status === 'entrada')
    .reduce((acc, p) => acc + (p.contractedValue || 0), 0);

  // Prazos e cronograma
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  let obrasAtrasadas = 0;
  let obrasAlerta = 0;
  let obrasNoPrazo = 0;

  activeProjects.forEach(p => {
    const deadline = new Date(p.deadlineDate);
    deadline.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      obrasAtrasadas++;
    } else if (diffDays <= 7) {
      obrasAlerta++;
    } else {
      obrasNoPrazo++;
    }
  });

  // Status Distribution Chart Data
  const statusChartData = [
    { name: 'Contratadas / Fila', count: contratadasAguardandoCount, color: '#f59e0b', label: 'Aguardando Produção' },
    { name: 'Em Fabricação / Solda', count: emFabricacaoCount, color: '#ea580c', label: 'Chão de Fábrica' },
    { name: 'Expedição / Logística', count: aguardandoEntregaCount, color: '#a855f7', label: 'Pronto p/ Envio' },
    { name: 'Montagem (Campo)', count: instalacaoCount, color: '#06b6d4', label: 'Em Instalação' },
    { name: 'Entregues / Concluídas', count: finalizadasCount, color: '#10b981', label: 'Finalizadas' },
  ];

  // Financial Distribution by Category
  const categoryFinancialMap: Record<string, number> = {};
  projects.forEach(p => {
    categoryFinancialMap[p.category] = (categoryFinancialMap[p.category] || 0) + (p.contractedValue || 0);
  });

  const categoryChartData = Object.entries(categoryFinancialMap).map(([name, value]) => ({
    name,
    valor: value,
  }));

  // Works requiring attention (sort by nearest deadline)
  const urgentWorks = [...activeProjects]
    .sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-600/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel Fabril & PCP em Tempo Real</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Gestão Integrada de Produção & Obras
          </h2>
          <p className="text-orange-100 text-xs sm:text-sm mt-1 max-w-2xl">
            Acompanhamento visual do fluxo de produção: desde obras contratadas na fila até corte, solda, acabamento, expedição e montagem.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {canEditProjects && (
            <button
              id="btn-dashboard-new-work"
              onClick={onOpenNewWorkModal}
              className="px-4 py-2.5 rounded-xl bg-white text-orange-700 hover:bg-orange-50 text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-orange-600" />
              <span>Nova Obra / Projeto</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Status Cards - Pipeline de Produção */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-600" />
            Esteira do Fluxo de Produção & Obras
          </h3>
          <button
            onClick={() => onNavigateToTab('production')}
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ver Fluxo Kanban Completo
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Obras Contratadas (Aguardando Início) */}
          <div 
            onClick={() => onNavigateToTab('production')}
            className="cursor-pointer bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900/50 rounded-2xl p-4 shadow-xs hover:border-amber-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                <ClipboardList className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Fila / PCP
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
              {contratadasAguardandoCount}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
              Obras Contratadas
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Aguardando entrada em produção
            </p>
          </div>

          {/* 2. Obras em Execução / Fabricação */}
          <div 
            onClick={() => onNavigateToTab('production')}
            className="cursor-pointer bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-900/50 rounded-2xl p-4 shadow-xs hover:border-orange-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 flex items-center justify-center shadow-2xs">
                <Hammer className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                Chão de Fábrica
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
              {emFabricacaoCount}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
              Em Fabricação & Solda
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Corte, gabarito, pintura e soldagem
            </p>
          </div>

          {/* 3. Obras Aguardando Entrega */}
          <div 
            onClick={() => onNavigateToTab('production')}
            className="cursor-pointer bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-900/50 rounded-2xl p-4 shadow-xs hover:border-purple-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center shadow-2xs">
                <Truck className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Expedição
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              {aguardandoEntregaCount}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
              Prontas p/ Entrega
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Fabricação finalizada, aguardando envio
            </p>
          </div>

          {/* 4. Obras em Instalação */}
          <div 
            onClick={() => onNavigateToTab('production')}
            className="cursor-pointer bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-900/50 rounded-2xl p-4 shadow-xs hover:border-cyan-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shadow-2xs">
                <HardHat className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Em Obra
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
              {instalacaoCount}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
              Em Instalação (Campo)
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Equipes de montagem ativas no cliente
            </p>
          </div>

          {/* 5. Obras Entregues e Finalizadas */}
          <div 
            onClick={() => onNavigateToTab('production')}
            className="cursor-pointer bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900/50 rounded-2xl p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Entregues
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              {finalizadasCount}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
              Obras Concluídas
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Estruturas montadas e aprovadas
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Operational & Financial Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Obras Ativas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Obras em Andamento</span>
            <Building2 className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {activeProjectsCount} <span className="text-xs font-semibold text-slate-500 font-normal">obras ativas</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
            <span>Média de avanço fabril: <strong>{avgActiveProgress}%</strong></span>
          </div>
        </div>

        {/* Obras Contratadas em Espera */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Contratadas (Não Iniciadas)</span>
            <ClipboardList className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {contratadasAguardandoCount} <span className="text-xs font-semibold text-slate-500 font-normal">na fila</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Volume em fila: <strong>{formatCurrency(valueAguardandoProducao)}</strong></span>
          </div>
        </div>

        {/* Cronograma & Prazos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Saúde dos Prazos</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs font-mono">
              {obrasNoPrazo} no prazo
            </span>
            {obrasAlerta > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs font-mono">
                {obrasAlerta} atenção
              </span>
            )}
            {obrasAtrasadas > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs font-mono">
                {obrasAtrasadas} atrasada(s)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Acompanhamento contínuo de entregas
          </div>
        </div>

        {/* Faturamento Contratado */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Contratado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalContractedValue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            <span>{totalProjectsCount} obras no histórico total</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Production Stage Distribution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>Distribuição das Obras por Etapa do Fluxo Fabril</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quantidade de estruturas metálicas em cada fase de fabricação e montagem
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('production')}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver Esteira
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value: any, name: any, item: any) => [`${value} Obra(s)`, item?.payload?.label || 'Quantidade']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a'
                  }} 
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Portfolio by Structure Category */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Portfólio por Tipo de Estrutura</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribuição do valor contratado por categoria
            </p>
          </div>

          <div className="space-y-3.5">
            {categoryChartData.map((cat, idx) => {
              const pct = totalContractedValue > 0 ? (cat.valor / totalContractedValue) * 100 : 0;
              const catWorksCount = projects.filter(p => p.category === cat.name).length;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">{catWorksCount} {catWorksCount === 1 ? 'obra' : 'obras'}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cat.valor)}</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Priority Obras & Cronograma de Produção */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Obras Ativas no Fluxo Fabril & Prazos de Entrega
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhamento prioritário de produção, montagem e cronograma
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('production')}
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ver Todas as Obras
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 px-2">Código / Obra</th>
                <th className="pb-3 px-2">Cliente</th>
                <th className="pb-3 px-2">Status no Fluxo</th>
                <th className="pb-3 px-2">Escopo / Itens</th>
                <th className="pb-3 px-2">Equipe / Líder</th>
                <th className="pb-3 px-2">Prazo de Entrega</th>
                <th className="pb-3 px-2 text-right">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {urgentWorks.map((work) => {
                const statusMeta = STATUS_LABELS[work.status] || { label: work.status, color: 'bg-slate-100 text-slate-800 border-slate-200' };
                const productsCount = work.contractedProducts?.length || 1;
                
                // Prazo dias
                const deadline = new Date(work.deadlineDate);
                deadline.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((deadline.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <tr 
                    key={work.id}
                    onClick={() => onSelectProject(work)}
                    className="hover:bg-orange-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="font-mono text-orange-600 dark:text-orange-400">{work.code}</span>
                        {work.orderCode && (
                          <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {work.orderCode}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 truncate max-w-[180px] block">
                        {work.title}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">
                        {work.clientName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {work.category}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <Package className="w-3.5 h-3.5 text-orange-600" />
                        <span>{productsCount} {productsCount === 1 ? 'item' : 'itens'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-2">
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate block max-w-[130px]">
                        {work.teamName || work.assemblerName || 'Fábrica'}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatDate(work.deadlineDate)}
                      </div>
                      <span className={`text-[10px] font-bold ${
                        diffDays < 0 ? 'text-rose-600' : diffDays <= 7 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {diffDays < 0 ? `${Math.abs(diffDays)}d em atraso` : diffDays === 0 ? 'Vence hoje' : `${diffDays}d restantes`}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-600 rounded-full" 
                            style={{ width: `${work.progressPercent}%` }} 
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white w-8">
                          {work.progressPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

