import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  DollarSign, 
  Layers, 
  HardHat, 
  Calendar, 
  CheckCircle2, 
  Clock,
  TrendingUp, 
  Users, 
  Award,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  WorkProject, 
  FinancialTransaction, 
  InstallationTeam, 
  SystemSettings 
} from '../types';
import { formatCurrency, formatKg, formatDate, getFactoryStages } from '../services/storage';
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

interface ReportsViewProps {
  projects: WorkProject[];
  transactions: FinancialTransaction[];
  teams: InstallationTeam[];
  settings: SystemSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  projects,
  transactions,
  teams,
  settings,
}) => {
  const [selectedReport, setSelectedReport] = useState<'receita' | 'desempenho_interno' | 'equipes'>('receita');

  const factoryStages = getFactoryStages();

  // Revenue metrics (No expenses, no profit margin)
  const totalContracted = projects.reduce((acc, p) => acc + (p.contractedValue || 0), 0);
  const contractedNotInProduction = projects.filter(p => p.status === 'nao_iniciada').length;
  const totalCompletedProjects = projects.filter(p => p.status === 'finalizada').length;
  const totalInProgressProjects = projects.filter(p => p.status !== 'finalizada' && p.status !== 'nao_iniciada').length;

  // Factory Stages Performance Data
  const stagesData = factoryStages.map(stage => {
    let countInStage = 0;
    projects.forEach(p => {
      if (p.productionOrders && p.productionOrders.length > 0) {
        p.productionOrders.forEach(os => {
          if (os.status === stage.statusMapping) {
            countInStage += 1;
          }
        });
      } else if (p.status === stage.statusMapping) {
        countInStage += 1;
      }
    });

    return {
      name: stage.name,
      workers: stage.workersCount,
      ordersCount: countInStage,
      dailyCapacity: (stage.dailyCapacityKgPerWorker ? Math.round(stage.dailyCapacityKgPerWorker / 100) : 8) * (stage.workersCount || 1),
    };
  });

  // Team Productivity Data
  const teamProductivityData = teams.map(t => {
    const allocated = projects.filter(p => p.teamId === t.id);
    const completed = allocated.filter(p => p.status === 'finalizada');
    const onTimeScore = t.productivityScore;

    return {
      teamName: t.name.replace('Equipe ', ''),
      worksTotal: allocated.length,
      worksDone: completed.length,
      score: onTimeScore,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Relatórios
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Relatórios consolidados de receita de obras, desempenho interno da fábrica e produtividade das equipes
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-orange-600" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Tabs for Submenus */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setSelectedReport('receita')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            selectedReport === 'receita'
              ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>1. Receita</span>
        </button>

        <button
          onClick={() => setSelectedReport('desempenho_interno')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            selectedReport === 'desempenho_interno'
              ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Desempenho Interno</span>
        </button>

        <button
          onClick={() => setSelectedReport('equipes')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            selectedReport === 'equipes'
              ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>3. Desempenho da Equipe</span>
        </button>
      </div>

      {/* SUBMENU 1: RECEITA */}
      {selectedReport === 'receita' && (
        <div className="space-y-4">
          {/* Executive Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Faturamento Total em Obras</span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalContracted)}
              </p>
              <span className="text-[11px] text-slate-400">{projects.length} obras cadastradas</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Obras Contratadas (A Iniciar)</span>
              <p className="text-2xl font-black font-mono text-orange-600 mt-1">
                {contractedNotInProduction}
              </p>
              <span className="text-[11px] text-slate-400">
                Aguardando emissão de OP fabril
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Obras Finalizadas</span>
              <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {totalCompletedProjects}
              </p>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                {projects.length > 0 ? `${((totalCompletedProjects / projects.length) * 100).toFixed(0)}% do portfólio entregue` : '0%'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Obras em Produção</span>
              <p className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                {totalInProgressProjects}
              </p>
              <span className="text-[11px] text-slate-400">
                Em fabricação / montagem
              </span>
            </div>
          </div>

          {/* Table of Projects Revenue (No Custo Real, No Lucro Bruto, No Margem) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Demonstrativo de Receita por Obra
              </h3>
              <span className="text-xs font-mono text-slate-400">{projects.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-3">Código / Obra</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Cód. Pedido</th>
                    <th className="py-3 px-3">Início</th>
                    <th className="py-3 px-3">Prazo Estimado</th>
                    <th className="py-3 px-3 text-center">Itens / Escopo</th>
                    <th className="py-3 px-3 text-right">Valor Contratado</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400 block">
                          {p.code}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white text-[11px]">
                          {p.title}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {p.clientName}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {p.orderCode || '-'}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {formatDate(p.startDate)}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {p.estimatedDeliveryDate ? formatDate(p.estimatedDeliveryDate) : formatDate(p.deadline)}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.contractedProducts?.length || 1} item(ns)
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.contractedValue)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBMENU 2: DESEMPENHO INTERNO */}
      {selectedReport === 'desempenho_interno' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart: Workers per Stage */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Distribuição de Operários por Fluxo de Produção
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stagesData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: number) => [`${val} operários`, 'Equipe Alocada']} />
                    <Bar dataKey="workers" fill="#ea580c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Capacity and Load Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Capacidade e Carga Atual por Etapa
              </h3>

              <div className="space-y-2.5 text-xs">
                {stagesData.map((stage, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {idx + 1}. {stage.name}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {stage.workers} operário(s) • Capacidade diária: {stage.dailyCapacity} ordens/dia
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-orange-600 block">
                        {stage.ordersCount} item(ns)
                      </span>
                      <span className="text-[10px] text-slate-400">na fila / processando</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMENU 3: DESEMPENHO DAS EQUIPES */}
      {selectedReport === 'equipes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart: Works by Team */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Obras Alocadas e Entregues por Equipe
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="teamName" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: number, name: string) => [`${val} obra(s)`, name === 'worksDone' ? 'Obras Entregues' : 'Obras Alocadas']} />
                    <Legend formatter={(val) => val === 'worksDone' ? 'Obras Entregues' : 'Total de Obras'} />
                    <Bar dataKey="worksTotal" fill="#94a3b8" radius={[6, 6, 0, 0]} name="worksTotal" />
                    <Bar dataKey="worksDone" fill="#ea580c" radius={[6, 6, 0, 0]} name="worksDone" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Performance Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Índice de Qualidade, Prazos e Segurança em Obra
              </h3>

              <div className="space-y-3 text-xs">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{team.name}</span>
                        <span className="text-[10px] text-slate-400">({team.leader})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {team.specialities.join(' • ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase font-semibold block">Score Montagem</span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">
                          {team.productivityScore}%
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
