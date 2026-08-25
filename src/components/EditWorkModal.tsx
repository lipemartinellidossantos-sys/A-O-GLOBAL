import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  Scale, 
  Layers, 
  HardHat, 
  Paintbrush, 
  MapPin, 
  FileText, 
  SlidersHorizontal,
  Clock,
  ShieldAlert,
  Hash,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  WorkProject, 
  WorkCategory, 
  WorkStatus, 
  Client, 
  Seller, 
  InstallationTeam,
  StructureTypeConfig
} from '../types';
import { addBusinessDays, formatCurrency, StorageService } from '../services/storage';

interface EditWorkModalProps {
  isOpen: boolean;
  onClose?: () => void;
  project: WorkProject | null;
  onSave: (updatedProject: WorkProject) => void;
  clients: Client[];
  sellers: Seller[];
  teams: InstallationTeam[];
  structureTypes?: StructureTypeConfig[];
}

const CATEGORIES: WorkCategory[] = [
  'Galpão Metálico',
  'Mezanino Estrutural',
  'Portão Industrial',
  'Guarda-Corpo & Corrimão',
  'Cobertura Metálica',
  'Escada Metálica',
  'Esquadrias de Aço',
  'Estrutura Especial',
];

const STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: 'nao_iniciada', label: '0. Não Iniciada / Aguardando OS' },
  { value: 'entrada', label: '1. Entrada / PCP & Detalhamento' },
  { value: 'producao', label: '2. Produção / Corte CNC & Soldagem' },
  { value: 'acabamento', label: '3. Acabamento / Pintura & Galvanização' },
  { value: 'aguardando_entrega', label: '4. Aguardando Entrega / Expedição' },
  { value: 'instalacao', label: '5. Instalação & Montagem em Campo' },
  { value: 'finalizada', label: '6. Entregue & Finalizada' },
];

export const EditWorkModal: React.FC<EditWorkModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  clients = [],
  sellers = [],
  teams = [],
  structureTypes,
}) => {
  if (!isOpen || !project) return null;

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const availableCategories = (structureTypes && structureTypes.length > 0 
    ? structureTypes 
    : StorageService.getStructureTypes()
  );

  // Form State initialized with current project data
  const [title, setTitle] = useState(project.title || '');
  const [orderCode, setOrderCode] = useState(project.orderCode || '');
  const [clientId, setClientId] = useState(project.clientId || '');
  const [sellerId, setSellerId] = useState(project.sellerId || '');
  const [teamId, setTeamId] = useState(project.teamId || '');
  const [category, setCategory] = useState<WorkCategory>(project.category || 'Galpão Metálico');
  const [status, setStatus] = useState<WorkStatus>(project.status || 'nao_iniciada');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>(project.priority || 'media');
  
  // Financials & Engineering
  const [contractedValue, setContractedValue] = useState<number>(project.contractedValue || 0);
  const [estimatedCost, setEstimatedCost] = useState<number>(project.estimatedCost || 0);
  const [actualCost, setActualCost] = useState<number>(project.actualCost || 0);
  const [steelWeightKg, setSteelWeightKg] = useState<number>(project.steelWeightKg || 0);

  // Dates & Timeline
  const [startDate, setStartDate] = useState<string>(project.startDate || new Date().toISOString().split('T')[0]);
  const [businessDays, setBusinessDays] = useState<number>(project.businessDays || 30);
  const [deadlineDate, setDeadlineDate] = useState<string>(project.deadlineDate || '');
  const [completionDate, setCompletionDate] = useState<string>(project.completionDate || '');

  // Specs & Site info
  const [assemblerName, setAssemblerName] = useState<string>(project.assemblerName || '');
  const [color, setColor] = useState<string>(project.color || '');
  const [footage, setFootage] = useState<string>(project.footage || '');
  const [address, setAddress] = useState<string>(project.address || '');
  const [description, setDescription] = useState<string>(project.description || '');
  const [notes, setNotes] = useState<string>(project.notes || '');

  // Auto-calculate deadline when business days or start date changes
  const handleBusinessDaysChange = (days: number) => {
    setBusinessDays(days);
    if (startDate && days > 0) {
      setDeadlineDate(addBusinessDays(startDate, days));
    }
  };

  const handleStartDateChange = (newDate: string) => {
    setStartDate(newDate);
    if (newDate && businessDays > 0) {
      setDeadlineDate(addBusinessDays(newDate, businessDays));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = clients.find(c => c.id === clientId);
    const selectedSeller = sellers.find(s => s.id === sellerId);
    const selectedTeam = teams.find(t => t.id === teamId);

    // Calculate progress percent according to status
    let calculatedProgress = project.progressPercent;
    if (status === 'nao_iniciada') calculatedProgress = 0;
    else if (status === 'entrada') calculatedProgress = Math.max(10, calculatedProgress);
    else if (status === 'producao') calculatedProgress = Math.max(40, calculatedProgress);
    else if (status === 'acabamento') calculatedProgress = Math.max(65, calculatedProgress);
    else if (status === 'aguardando_entrega') calculatedProgress = Math.max(85, calculatedProgress);
    else if (status === 'instalacao') calculatedProgress = Math.max(90, calculatedProgress);
    else if (status === 'finalizada') calculatedProgress = 100;

    const updatedProject: WorkProject = {
      ...project,
      title: title.trim() || project.title,
      orderCode: orderCode.trim(),
      clientId: clientId || project.clientId,
      clientName: selectedClient ? (selectedClient.tradeName || selectedClient.name) : project.clientName,
      sellerId: sellerId || project.sellerId,
      sellerName: selectedSeller ? selectedSeller.name : project.sellerName,
      teamId: teamId || undefined,
      teamName: selectedTeam ? selectedTeam.name : (teamId ? project.teamName : undefined),
      category,
      status,
      priority,
      progressPercent: calculatedProgress,
      contractedValue: Number(contractedValue) || 0,
      estimatedCost: Number(estimatedCost) || 0,
      actualCost: Number(actualCost) || 0,
      steelWeightKg: Number(steelWeightKg) || 0,
      startDate,
      businessDays: Number(businessDays) || 0,
      deadlineDate,
      completionDate: status === 'finalizada' ? (completionDate || new Date().toISOString().split('T')[0]) : completionDate,
      assemblerName: assemblerName.trim(),
      color: color.trim(),
      footage: footage.trim(),
      address: address.trim(),
      description: description.trim(),
      notes: notes.trim(),
    };

    onSave(updatedProject);
    handleClose();
  };

  // Quick margins calculation for instant preview in form
  const rawMargin = contractedValue - actualCost;
  const marginPercent = contractedValue > 0 ? ((rawMargin / contractedValue) * 100).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950 text-white flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-orange-400 bg-orange-950/90 px-2 py-0.5 rounded-full border border-orange-800">
                  {project.code}
                </span>
                <span className="text-xs text-slate-400">Edição Geral da Obra</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Editar Dados da Obra: {project.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6 text-xs">
          
          {/* SECTION 1: IDENTIFICAÇÃO BÁSICA & COMERCIAL */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-orange-600" />
              <span>1. Identificação & Vínculos Comerciais</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título / Nome da Obra *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold"
                  placeholder="Ex: Galpão Logístico ABC 1.200m²"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Código do Pedido Comercial
                </label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  placeholder="Ex: PED-2026-8901"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cliente *
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName || c.name} ({c.document})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vendedor / Comercial Responsável
                </label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione um vendedor...</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria Estrutural *
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as WorkCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold"
                >
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  {/* Keep current category as option if it's not in the list */}
                  {!availableCategories.some(c => c.name === category) && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Etapa / Status Atual
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WorkStatus)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prioridade Operacional
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: DADOS FINANCEIROS & MARGEM */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>2. Indicadores Financeiros & Orçamento</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Margem estimada: <strong className="text-emerald-600">{formatCurrency(rawMargin)} ({marginPercent}%)</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Valor Contratado (Receita Total R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={contractedValue}
                    onChange={(e) => setContractedValue(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Custo Previsto / Orçamento Base (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Custo Real Acumulado Base (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={actualCost}
                    onChange={(e) => setActualCost(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: CRONOGRAMA & DATAS */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>3. Cronograma & Prazos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prazo em Dias Úteis
                </label>
                <input
                  type="number"
                  min="1"
                  value={businessDays}
                  onChange={(e) => handleBusinessDaysChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data Prevista de Entrega
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Conclusão Efetiva
                </label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: CANTEIRO, EQUIPE & ESPECIFICAÇÕES */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800">
              <HardHat className="w-4 h-4 text-orange-600" />
              <span>4. Canteiro, Montagem & Especificações Técnicas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Equipe de Montagem
                </label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Sem equipe alocada...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Encarregado / Montador Líder
                </label>
                <input
                  type="text"
                  value={assemblerName}
                  onChange={(e) => setAssemblerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Mestre Valdemar"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pintura / Acabamento
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Preto Fosco Eletrostático"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Metragem / Área Total
                </label>
                <input
                  type="text"
                  value={footage}
                  onChange={(e) => setFootage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  placeholder="Ex: 850 m²"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço / Local da Instalação
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Av. das Indústrias, 1500 - Distrito Industrial, Curitiba - PR"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição Técnica do Escopo
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  placeholder="Especificações dos perfis, tesouras, terças, pilares..."
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Gerais e Administrativas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  placeholder="Informações de acesso ao canteiro, ART emitida, regras do condomínio..."
                />
              </div>
            </div>
          </div>

          {/* MODAL BOTTOM BUTTONS */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações da Obra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
