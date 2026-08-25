import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  DollarSign, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Wallet,
  Calendar,
  Layers,
  Building,
  CreditCard,
  FileCheck,
  TrendingUp
} from 'lucide-react';
import { 
  FinancialTransaction, 
  WorkProject 
} from '../types';
import { formatCurrency, formatDate } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface FinancialViewProps {
  transactions: FinancialTransaction[];
  projects: WorkProject[];
  onOpenNewTransactionModal: (project?: WorkProject) => void;
  onToggleTransactionStatus: (transactionId: string) => void;
  onDeleteTransaction: (transactionId: string) => void;
  canEditFinancial: boolean;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  transactions,
  projects,
  onOpenNewTransactionModal,
  onToggleTransactionStatus,
  onDeleteTransaction,
  canEditFinancial,
}) => {
  const [activeTab, setActiveTab] = useState<'lancamentos' | 'por_obra'>('lancamentos');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pago' | 'pendente'>('todos');
  const [projectFilter, setProjectFilter] = useState<string>('todos');
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);

  // Keep only revenues
  const revenueTransactions = transactions.filter(t => t.type === 'receita');

  // KPI Calculations based strictly on projects and their revenues
  const totalContractedValue = projects.reduce((acc, p) => acc + (p.contractedValue || 0), 0);

  const totalReceived = revenueTransactions
    .filter(t => t.status === 'pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPendingFromTransactions = revenueTransactions
    .filter(t => t.status !== 'pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalBalanceToReceive = Math.max(0, totalContractedValue - totalReceived);

  // Filtered transactions list
  const filtered = revenueTransactions.filter((t) => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.recipientOrPayer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.workCode && t.workCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || (statusFilter === 'pago' ? t.status === 'pago' : t.status !== 'pago');
    const matchesProject = projectFilter === 'todos' || t.workProjectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  // Calculate project financial health
  const projectsFinancialSummary = projects.map(p => {
    const pTransactions = revenueTransactions.filter(t => t.workProjectId === p.id);
    const pReceived = pTransactions.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.amount, 0);
    const pPendingPlanned = pTransactions.filter(t => t.status !== 'pago').reduce((sum, t) => sum + t.amount, 0);
    const openBalance = Math.max(0, p.contractedValue - pReceived);

    let paymentStatus: 'Quitada' | 'Parcial' | 'Pendente' = 'Pendente';
    if (pReceived >= p.contractedValue && p.contractedValue > 0) {
      paymentStatus = 'Quitada';
    } else if (pReceived > 0) {
      paymentStatus = 'Parcial';
    }

    return {
      project: p,
      contractedValue: p.contractedValue,
      received: pReceived,
      openBalance,
      pendingPlanned: pPendingPlanned,
      paymentStatus,
      transactionsCount: pTransactions.length,
    };
  });

  const projectsWithPendingBalance = projectsFinancialSummary.filter(p => p.openBalance > 0);

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Controle Financeiro de Obras & Recebimentos
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Acompanhamento consolidado dos valores contratados, parcelas faturadas e saldos a receber por obra
          </p>
        </div>

        {canEditFinancial && (
          <button
            id="btn-new-receipt"
            onClick={() => onOpenNewTransactionModal()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Recebimento de Obra</span>
          </button>
        )}
      </div>

      {/* Financial KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Faturamento Total Contratado */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Total Obras</span>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalContractedValue)}
          </p>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>Obras Cadastradas:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{projects.length} contratos</span>
          </div>
        </div>

        {/* 2. Total Recebido */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Já Recebido</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalReceived)}
          </p>
          <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-medium">
            <span>Taxa de Quitação:</span>
            <span className="font-bold">
              {totalContractedValue > 0 ? `${((totalReceived / totalContractedValue) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* 3. Saldo Total a Receber */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Saldo a Receber</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {formatCurrency(totalBalanceToReceive)}
          </p>
          <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between font-medium">
            <span>Parcelas em Aberto:</span>
            <span className="font-bold">{formatCurrency(totalPendingFromTransactions)}</span>
          </div>
        </div>

        {/* 4. Obras com Saldo Pendente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Obras c/ Saldo Aberto</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {projectsWithPendingBalance.length} <span className="text-xs font-medium text-slate-600 dark:text-slate-300">obras</span>
          </p>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>Quitadas integralmente:</span>
            <span className="font-bold text-emerald-600">
              {projects.length - projectsWithPendingBalance.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('lancamentos')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'lancamentos'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Todos os Recebimentos & Parcelas ({filtered.length})
        </button>
        <button
          onClick={() => setActiveTab('por_obra')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'por_obra'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Resumo Financeiro por Obra ({projects.length})
        </button>
      </div>

      {activeTab === 'lancamentos' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por descrição, cliente, obra ou NF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filtrar por Status de Recebimento"
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="todos">Todos os Status (Recebidos e Pendentes)</option>
              <option value="pago">Quitados / Recebidos</option>
              <option value="pendente">Pendentes / Em Aberto</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              aria-label="Filtrar por Obra"
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="todos">Todas as Obras</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Receipts Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-3">Obra / Código</th>
                    <th className="py-3 px-3">Descrição da Parcela / Recebimento</th>
                    <th className="py-3 px-3">Cliente / Pagador</th>
                    <th className="py-3 px-3">Data Vencimento</th>
                    <th className="py-3 px-3">Forma Pagto</th>
                    <th className="py-3 px-3 text-right">Valor Recebido (R$)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    {canEditFinancial && <th className="py-3 px-3 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Nenhum recebimento registrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          {t.workCode ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-orange-600 dark:text-orange-400">
                              <Layers className="w-3.5 h-3.5" />
                              {t.workCode}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {t.description}
                          </span>
                          {t.invoiceNumber && (
                            <span className="text-[10px] text-slate-600 dark:text-slate-300">
                              NF-e: {t.invoiceNumber}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {t.recipientOrPayer}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {formatDate(t.dueDate)}
                        </td>

                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                          {t.paymentMethod}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          + {formatCurrency(t.amount)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            disabled={!canEditFinancial}
                            onClick={() => onToggleTransactionStatus(t.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                              t.status === 'pago'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:opacity-80'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-emerald-200'
                            } ${!canEditFinancial ? 'cursor-default' : 'cursor-pointer'}`}
                            title={canEditFinancial ? 'Clique para alterar status' : undefined}
                          >
                            {t.status === 'pago' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Recebido</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>A Receber</span>
                              </>
                            )}
                          </button>
                        </td>

                        {canEditFinancial && (
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setTransactionToDelete(t)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Excluir recebimento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Summary Per Project Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Obra / Título</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3 text-right">Valor Contratado</th>
                  <th className="py-3 px-3 text-right">Total Recebido</th>
                  <th className="py-3 px-3 text-right">Saldo a Receber</th>
                  <th className="py-3 px-3 text-center">Status Pagamento</th>
                  {canEditFinancial && <th className="py-3 px-3 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projectsFinancialSummary.map(row => (
                  <tr key={row.project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {row.project.code}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {row.project.title}
                    </td>

                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {row.project.clientName}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(row.contractedValue)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.received)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {row.openBalance > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">{formatCurrency(row.openBalance)}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">R$ 0,00 (Quitado)</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.paymentStatus === 'Quitada'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : row.paymentStatus === 'Parcial'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {row.paymentStatus}
                      </span>
                    </td>

                    {canEditFinancial && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenNewTransactionModal(row.project)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Lançar recebimento para esta obra"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Recebimento</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!transactionToDelete}
        title="Excluir Lançamento de Recebimento?"
        message={`Deseja realmente excluir o lançamento "${transactionToDelete?.description}" no valor de ${transactionToDelete ? formatCurrency(transactionToDelete.amount) : ''}? Esta ação removerá o registro financeiro.`}
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onClose={() => setTransactionToDelete(null)}
      />
    </div>
  );
};
