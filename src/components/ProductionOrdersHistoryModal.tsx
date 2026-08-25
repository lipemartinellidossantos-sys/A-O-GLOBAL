import React, { useState } from 'react';
import { 
  X, 
  Kanban, 
  Printer, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  Plus, 
  FileText, 
  Tag, 
  AlertCircle, 
  Check, 
  Building2, 
  User, 
  Hash, 
  Paintbrush, 
  ShieldAlert,
  SlidersHorizontal,
  Search,
  ExternalLink,
  Eye,
  Download
} from 'lucide-react';
import { WorkProject, ProductionOrderItem, ContractedProductItem } from '../types';
import { PdfViewerModal } from './PdfViewerModal';
import { downloadFile, generateProductionOrderDrawingPdfDataUrl } from '../utils/pdfHelper';

interface ProductionOrdersHistoryModalProps {
  isOpen: boolean;
  onClose?: () => void;
  project: WorkProject;
  onOpenGenerateOrder?: (project: WorkProject) => void;
  onNavigateToProductionKanban?: (projectId?: string) => void;
}

export const ProductionOrdersHistoryModal: React.FC<ProductionOrdersHistoryModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenGenerateOrder,
  onNavigateToProductionKanban,
}) => {
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<ProductionOrderItem | null>(null);

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
      structureType: order.structureType,
    });
  };

  if (!isOpen) return null;

  const orders: ProductionOrderItem[] = project.productionOrders || [];
  const products: ContractedProductItem[] = project.contractedProducts || [];

  // Totals calculations
  const totalProductsCount = products.length;
  const totalOrdersCount = orders.length;

  const totalQuantityContracted = products.reduce((acc, p) => acc + (p.quantityTotal || 0), 0);
  const totalQuantityInProduction = products.reduce((acc, p) => acc + (p.quantityInProduction || 0), 0);
  const percentInProduction = totalQuantityContracted > 0 
    ? Math.min(100, Math.round((totalQuantityInProduction / totalQuantityContracted) * 100))
    : 0;

  const hasRemainingBalance = products.some(p => ((p.quantityInProduction || 0) < (p.quantityTotal || 0)));

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.osNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.notes && order.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.assignedTeam && order.assignedTeam.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não definida';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'nao_iniciada':
        return { label: '0. Não Iniciada', bg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' };
      case 'entrada':
        return { label: '1. Entrada / PCP', bg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' };
      case 'producao':
        return { label: '2. Corte CNC', bg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' };
      case 'solda':
        return { label: '3. Soldagem', bg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800' };
      case 'jateamento':
        return { label: '4. Pintura', bg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800' };
      case 'acabamento':
        return { label: '5. Acabamento', bg: 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800' };
      case 'aguardando_entrega':
        return { label: '6. Expedição', bg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800' };
      case 'instalacao':
        return { label: '7. Instalação', bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
      case 'finalizada':
        return { label: 'Concluída', bg: 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border-emerald-400' };
      default:
        return { label: status, bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300' };
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 font-black';
      case 'alta':
        return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-300 font-bold';
      case 'media':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300';
      case 'baixa':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300';
    }
  };

  const handlePrint = (order?: ProductionOrderItem) => {
    if (order) {
      setSelectedOrderForPrint(order);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP MODAL HEADER */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 shrink-0">
              <Kanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-950/90 px-2.5 py-0.5 rounded-full border border-orange-800/80 font-mono">
                  Histórico de Ordens de Produção (OS)
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                  {project.code}
                </span>
                {project.orderCode && (
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800/80">
                    Pedido: {project.orderCode}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1">
                {project.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Cliente: <strong className="text-slate-200">{project.clientName}</strong>
                </span>
                <span>•</span>
                <span>Categoria: <strong className="text-slate-200">{project.category}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {hasRemainingBalance && onOpenGenerateOrder && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenGenerateOrder(project);
                }}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Gerar Nova OS</span>
              </button>
            )}

            {onNavigateToProductionKanban && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onNavigateToProductionKanban(project.id);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Abrir no Fluxo de Produção (Kanban)"
              >
                <Kanban className="w-4 h-4" />
                <span>Ver no Fluxo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUMMARY KPIS BAR */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Total de OS Emitidas</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black font-mono text-orange-600 dark:text-orange-400">{totalOrdersCount}</span>
              <span className="text-xs text-slate-500">ordens/lotes</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Produtos Cadastrados</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{totalProductsCount}</span>
              <span className="text-xs text-slate-500">itens da obra</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Volume em Fabricação</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{percentInProduction}%</span>
              <span className="text-xs text-slate-500">liberado</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Status da Produção</span>
            <div className="mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {project.productionOrderGenerated ? 'OS Ativa no Fluxo' : 'Aguardando OS'}
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número da OS, produto ou instruções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => handlePrint()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Imprimir Relatório Completo de Ordens de Produção"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relatório</span>
            </button>
          </div>
        </div>

        {/* ORDERS LIST CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {orders.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-xs">
                <Kanban className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Nenhuma Ordem de Produção (OS) gerada para esta obra ainda
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1">
                  Ao emitir uma ordem de produção, os produtos contratados são liberados para fabricação e entram diretamente na coluna <strong className="text-slate-900 dark:text-white">0. Não Iniciada</strong> da esteira fabril.
                </p>
              </div>

              {onOpenGenerateOrder && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenGenerateOrder(project);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-lg shadow-orange-600/30 inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Emitir 1ª Ordem de Produção</span>
                </button>
              )}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhuma ordem encontrada para os filtros selecionados.</p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('todos'); }}
                className="mt-2 text-orange-600 font-bold text-xs underline"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order, idx) => {
                const statusBadge = getStatusBadge(order.status || 'nao_iniciada');
                const priorityBadge = getPriorityBadge(order.priority);

                return (
                  <div
                    key={order.id || idx}
                    className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-orange-400 dark:hover:border-orange-600/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 flex items-center justify-center font-black text-sm shrink-0 font-mono border border-orange-200 dark:border-orange-900/50">
                        #{filteredOrders.length - idx}
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {order.osNumber}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>

                          {order.priority && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${priorityBadge}`}>
                              Prioridade: {order.priority.toUpperCase()}
                            </span>
                          )}

                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Emitida em: <strong className="text-slate-700 dark:text-slate-300">{formatDate(order.issuedAt)}</strong>
                          </span>

                          {order.deadlineDate && (
                            <span className="text-[11px] text-orange-600 dark:text-orange-400 flex items-center gap-1 font-bold">
                              <Clock className="w-3 h-3" />
                              Prazo Fabril: {formatDate(order.deadlineDate)}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-orange-600 shrink-0" />
                          <span>{order.productDescription}</span>
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap pt-0.5">
                          <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-md font-mono font-extrabold border border-orange-200 dark:border-orange-900/50">
                            Lote Programado: {order.quantity} {order.unit}
                          </span>

                          {order.paintColor && (
                            <span className="flex items-center gap-1">
                              <Paintbrush className="w-3.5 h-3.5 text-slate-400" />
                              Pintura: <strong className="text-slate-800 dark:text-slate-200">{order.paintColor}</strong>
                            </span>
                          )}

                          {order.assignedTeam && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Encarregado: <strong className="text-slate-800 dark:text-slate-200">{order.assignedTeam}</strong>
                            </span>
                          )}
                        </div>

                        {order.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 mt-1.5">
                            "{order.notes}"
                          </p>
                        )}

                        {/* PDF / Technical Drawing Attachment Badge */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900 text-[10px] font-bold">
                            <FileText className="w-3 h-3 text-orange-600" />
                            <span>{order.pdfAttachment?.name || `Desenho_Fabril_${order.osNumber}.pdf`}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions on this single order */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end flex-wrap">
                      {/* Botão para apenas visualizar o PDF */}
                      <button
                        type="button"
                        onClick={() => {
                          const url = getOrderPdfDataUrl(order);
                          const name = order.pdfAttachment?.name || `Desenho_Fabril_${order.osNumber}.pdf`;
                          setPdfViewerState({
                            isOpen: true,
                            url,
                            fileName: name,
                            fileSizeBytes: order.pdfAttachment?.sizeBytes || 128000
                          });
                        }}
                        className="px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Apenas Visualizar PDF da Ordem / Desenho Técnico"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visualizar PDF</span>
                      </button>

                      {/* Botão para fazer o Download do PDF */}
                      <button
                        type="button"
                        onClick={() => {
                          const url = getOrderPdfDataUrl(order);
                          const name = order.pdfAttachment?.name || `Desenho_Fabril_${order.osNumber}.pdf`;
                          downloadFile(url, name);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Fazer Download do PDF da Ordem"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrint(order)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        title="Imprimir Ficha desta OS"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Imprimir</span>
                      </button>

                      {onNavigateToProductionKanban && (
                        <button
                          type="button"
                          onClick={() => {
                            handleClose();
                            onNavigateToProductionKanban(project.id);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                          title="Localizar e gerenciar no Fluxo de Produção"
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

          {/* PRODUCT BREAKDOWN SUMMARY SECTION */}
          {products.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Quadro de Liberação por Produto da Obra</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {totalQuantityInProduction} de {totalQuantityContracted} itens em fabricação
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.map(prod => {
                  const qTot = prod.quantityTotal || 1;
                  const qInP = prod.quantityInProduction || 0;
                  const qRem = Math.max(0, qTot - qInP);
                  const isComplete = qRem === 0;
                  const pct = Math.min(100, Math.round((qInP / qTot) * 100));

                  return (
                    <div
                      key={prod.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                          {prod.description}
                        </span>
                        {isComplete ? (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                            100% OK
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                            Resta: {qRem} {prod.unit}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Total: {qTot} {prod.unit}</span>
                          <span className="text-orange-600 font-bold">Produção: {qInP} {prod.unit} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-orange-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Código e número da OS vinculados diretamente ao código do pedido da obra com desenhos técnicos para a fábrica.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar Histórico
            </button>
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
    </div>
  );
};
