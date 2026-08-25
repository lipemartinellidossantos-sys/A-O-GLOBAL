import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  Save, 
  AlertCircle, 
  Users, 
  Kanban,
  Palette,
  CheckCircle2,
  Sparkles,
  Info,
  Lock
} from 'lucide-react';
import { FactoryStageConfig, WorkStatus } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface FactoryStagesSettingsProps {
  stages: FactoryStageConfig[];
  onSaveStages: (stages: FactoryStageConfig[]) => void;
  canManageSettings: boolean;
}

const AVAILABLE_COLORS = [
  { label: 'Âmbar / Entrada', color: 'text-amber-700 dark:text-amber-300', dotColor: 'bg-amber-500', headerBg: 'bg-amber-50 dark:bg-amber-950/30' },
  { label: 'Laranja / Corte & Solda', color: 'text-orange-700 dark:text-orange-300', dotColor: 'bg-orange-500', headerBg: 'bg-orange-50 dark:bg-orange-950/30' },
  { label: 'Rosa / Caldeiraria', color: 'text-rose-700 dark:text-rose-300', dotColor: 'bg-rose-500', headerBg: 'bg-rose-50 dark:bg-rose-950/30' },
  { label: 'Azul / Pintura', color: 'text-blue-700 dark:text-blue-300', dotColor: 'bg-blue-500', headerBg: 'bg-blue-50 dark:bg-blue-950/30' },
  { label: 'Roxo / Expedição', color: 'text-purple-700 dark:text-purple-300', dotColor: 'bg-purple-500', headerBg: 'bg-purple-50 dark:bg-purple-950/30' },
  { label: 'Ciano / Montagem', color: 'text-cyan-700 dark:text-cyan-300', dotColor: 'bg-cyan-500', headerBg: 'bg-cyan-50 dark:bg-cyan-950/30' },
  { label: 'Verde / Concluído', color: 'text-emerald-700 dark:text-emerald-300', dotColor: 'bg-emerald-500', headerBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { label: 'Cinza / Neutro', color: 'text-slate-700 dark:text-slate-300', dotColor: 'bg-slate-400', headerBg: 'bg-slate-100 dark:bg-slate-900/60' },
  { label: 'Índigo / Especial', color: 'text-indigo-700 dark:text-indigo-300', dotColor: 'bg-indigo-500', headerBg: 'bg-indigo-50 dark:bg-indigo-950/30' },
];

const DEFAULT_FACTORY_STAGES: FactoryStageConfig[] = [
  { id: 'stage-1', name: '1. Ordem de Produção Pronta para Descer para Fábrica', description: 'Ordem de serviço liberada pela engenharia e pronta para iniciar a fabricação na fábrica.', order: 1, statusMapping: 'entrada', color: 'border-amber-300 text-amber-700 dark:text-amber-300', dotColor: 'bg-amber-500', headerBg: 'bg-amber-50 dark:bg-amber-950/30', workersCount: 2, dailyCapacityKgPerWorker: 2000 },
  { id: 'stage-2', name: '2. Corte, Guilhotina & Plasma', description: 'Corte de chapas, perfis laminados, vigas e furação mecânica.', order: 2, statusMapping: 'producao', color: 'border-orange-300 text-orange-700 dark:text-orange-300', dotColor: 'bg-orange-500', headerBg: 'bg-orange-50 dark:bg-orange-950/30', workersCount: 4, dailyCapacityKgPerWorker: 1200 },
  { id: 'stage-3', name: '3. Gabaritagem & Solda Estrutural', description: 'Montagem de peças, caldeiraria, solda MIG/MAG e arco submerso.', order: 3, statusMapping: 'producao', color: 'border-rose-300 text-rose-700 dark:text-rose-300', dotColor: 'bg-rose-500', headerBg: 'bg-rose-50 dark:bg-rose-950/30', workersCount: 6, dailyCapacityKgPerWorker: 800 },
  { id: 'stage-4', name: '4. Tratamento & Pintura Industrial', description: 'Desengraxe, jateamento abrasivo, aplicação de primer epóxi e acabamento PU.', order: 4, statusMapping: 'acabamento', color: 'border-blue-300 text-blue-700 dark:text-blue-300', dotColor: 'bg-blue-500', headerBg: 'bg-blue-50 dark:bg-blue-950/30', workersCount: 3, dailyCapacityKgPerWorker: 1500 },
  { id: 'stage-5', name: '5. Separação & Expedição', description: 'Conferência de romaneio, fixadores, amarração e carregamento em caminhões.', order: 5, statusMapping: 'aguardando_entrega', color: 'border-purple-300 text-purple-700 dark:text-purple-300', dotColor: 'bg-purple-500', headerBg: 'bg-purple-50 dark:bg-purple-950/30', workersCount: 2, dailyCapacityKgPerWorker: 3000 },
  { id: 'stage-6', name: '6. Montagem em Campo / Instalação', description: 'Içamento com munck/guindaste, alinhamento, torqueamento e entrega técnica.', order: 6, statusMapping: 'instalacao', color: 'border-cyan-300 text-cyan-700 dark:text-cyan-300', dotColor: 'bg-cyan-500', headerBg: 'bg-cyan-50 dark:bg-cyan-950/30', workersCount: 5, dailyCapacityKgPerWorker: 700 },
  { id: 'stage-7', name: '7. Obra Concluída & Entregue', description: 'Obra 100% finalizada com aceite técnico do cliente e liberação de garantia.', order: 7, statusMapping: 'finalizada', color: 'border-emerald-300 text-emerald-700 dark:text-emerald-300', dotColor: 'bg-emerald-500', headerBg: 'bg-emerald-50 dark:bg-emerald-950/30', workersCount: 1, dailyCapacityKgPerWorker: 2000 },
];

export const FactoryStagesSettings: React.FC<FactoryStagesSettingsProps> = ({
  stages,
  onSaveStages,
  canManageSettings,
}) => {
  const currentStages = stages && stages.length > 0 ? stages : DEFAULT_FACTORY_STAGES;
  const sortedStages = [...currentStages].sort((a, b) => a.order - b.order);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<FactoryStageConfig | null>(null);
  const [stageToDelete, setStageToDelete] = useState<FactoryStageConfig | null>(null);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workersCount, setWorkersCount] = useState<number>(2);
  const [statusMapping, setStatusMapping] = useState<WorkStatus>('producao');
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(1);
  const [formError, setFormError] = useState('');

  const handleOpenAdd = () => {
    setEditingStage(null);
    setName('');
    setDescription('');
    setWorkersCount(2);
    setStatusMapping('producao');
    setSelectedColorIndex(1);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stage: FactoryStageConfig) => {
    setEditingStage(stage);
    setName(stage.name);
    setDescription(stage.description);
    setWorkersCount(stage.workersCount || 1);
    setStatusMapping(stage.statusMapping || 'producao');
    const colorIdx = AVAILABLE_COLORS.findIndex(c => c.dotColor === stage.dotColor);
    setSelectedColorIndex(colorIdx >= 0 ? colorIdx : 1);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Informe o nome da etapa fabril.');
      return;
    }

    const colorStyle = AVAILABLE_COLORS[selectedColorIndex];
    let updatedList: FactoryStageConfig[];

    if (editingStage) {
      updatedList = sortedStages.map(st => {
        if (st.id === editingStage.id) {
          return {
            ...st,
            name: name.trim(),
            description: description.trim(),
            workersCount: Number(workersCount) || 1,
            statusMapping: statusMapping,
            color: colorStyle.color,
            dotColor: colorStyle.dotColor,
            headerBg: colorStyle.headerBg,
          };
        }
        return st;
      });
    } else {
      const newStage: FactoryStageConfig = {
        id: `stage-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        order: sortedStages.length + 1,
        workersCount: Number(workersCount) || 1,
        statusMapping: statusMapping,
        color: colorStyle.color,
        dotColor: colorStyle.dotColor,
        headerBg: colorStyle.headerBg,
      };
      updatedList = [...sortedStages, newStage];
    }

    // Re-index orders strictly 1..N
    const normalized = updatedList.map((item, idx) => ({ ...item, order: idx + 1 }));
    onSaveStages(normalized);
    setIsModalOpen(false);
    showSavedFeedback();
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...sortedStages];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    const normalized = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    onSaveStages(normalized);
    showSavedFeedback();
  };

  const handleMoveDown = (index: number) => {
    if (index >= sortedStages.length - 1) return;
    const newItems = [...sortedStages];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    const normalized = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    onSaveStages(normalized);
    showSavedFeedback();
  };

  const handleDeleteConfirmed = () => {
    if (!stageToDelete) return;
    const filtered = sortedStages.filter(st => st.id !== stageToDelete.id);
    const normalized = filtered.map((item, idx) => ({ ...item, order: idx + 1 }));
    onSaveStages(normalized);
    setStageToDelete(null);
    showSavedFeedback();
  };

  const handleResetDefaults = () => {
    onSaveStages(DEFAULT_FACTORY_STAGES);
    showSavedFeedback();
  };

  const showSavedFeedback = () => {
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Rule Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-amber-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-black text-amber-900 dark:text-amber-200">
            Regra Operacional da Esteira Fabril
          </h4>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
            A <b>Etapa 1 ("Ordem de Produção Pronta para Descer para Fábrica")</b> é o destino automático assim que uma Ordem de Produção (OS) é emitida. Ao avançar a obra pelas etapas seguintes, o percentual de progresso é preenchido e atualizado automaticamente em todo o sistema.
          </p>
        </div>
      </div>

      {/* Header Info & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Kanban className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Etapas e Colunas do Fluxo de Produção
            </h3>
            {saveFeedback && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Salvo com Sucesso!
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure a ordem das colunas, nomes personalizados e a quantidade de operários alocados em cada fase.
          </p>
        </div>

        {canManageSettings && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Restaurar fluxo padrão da indústria"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Etapa Fabril</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Flow Stages List */}
      <div className="space-y-2.5">
        {sortedStages.map((stage, index) => {
          const isFirstStage = index === 0;

          return (
            <div
              key={stage.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group ${
                isFirstStage 
                  ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/40'
              }`}
            >
              {/* Left: Order index badge, Color Dot & Details */}
              <div className="flex items-start md:items-center gap-3">
                {/* Order index pill */}
                <div className={`w-8 h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                  isFirstStage
                    ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-300 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {index + 1}º
                </div>

                {/* Dot & Title */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${stage.dotColor || 'bg-orange-500'}`} />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {stage.name}
                    </h4>
                    {isFirstStage && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Entrada da OS
                      </span>
                    )}
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Status: {stage.statusMapping || 'producao'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {stage.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>
              </div>

              {/* Right: Operational Metrics & Controls */}
              <div className="flex items-center gap-4 self-end md:self-center flex-wrap">
                {/* Workers Allocation */}
                <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <Users className="w-3.5 h-3.5 text-orange-600" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{stage.workersCount || 1}</span>
                  <span className="text-slate-500 text-[10px]">operários alocados</span>
                </div>

                {/* Action Buttons */}
                {canManageSettings && (
                  <div className="flex items-center gap-1">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Mover etapa para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === sortedStages.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Mover etapa para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(stage)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/60 text-slate-700 dark:text-slate-300 hover:text-orange-600 transition-colors cursor-pointer"
                      title="Editar Etapa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    {sortedStages.length > 2 && !isFirstStage && (
                      <button
                        type="button"
                        onClick={() => setStageToDelete(stage)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Excluir Etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Kanban className="w-4 h-4 text-orange-600" />
                {editingStage ? 'Editar Etapa do Fluxo Fabril' : 'Cadastrar Nova Etapa no Fluxo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStage} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nome da Etapa no Kanban / PCP *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: 2. Corte, Guilhotina & Plasma"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Descrição dos Procedimentos
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Operações de corte térmico CNC, furação em vigas e corte em guilhotina."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Operários Alocados
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={workersCount}
                    onChange={(e) => setWorkersCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Mapeamento de Status
                  </label>
                  <select
                    value={statusMapping}
                    onChange={(e) => setStatusMapping(e.target.value as WorkStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="entrada">1. Entrada / OS Pronta para Fábrica</option>
                    <option value="producao">2. Corte, Solda & Fabricação</option>
                    <option value="acabamento">3. Pintura & Acabamento</option>
                    <option value="aguardando_entrega">4. Separação & Expedição</option>
                    <option value="instalacao">5. Instalação & Montagem</option>
                    <option value="finalizada">6. Entregue & Concluída</option>
                    <option value="nao_iniciada">Aguardando OS</option>
                  </select>
                </div>
              </div>

              {/* Color Palette Choice */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Identidade Visual da Coluna no Kanban
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_COLORS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColorIndex(idx)}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        selectedColorIndex === idx
                          ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/50 dark:bg-orange-950/30'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.dotColor}`} />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        {c.label.split(' / ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Etapa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {stageToDelete && (
        <ConfirmModal
          isOpen={Boolean(stageToDelete)}
          title="Excluir Etapa do Fluxo Fabril"
          message={`Tem certeza que deseja excluir a etapa "${stageToDelete.name}"? As obras existentes permanecerão com seus respectivos status, mas a coluna será removida da esteira.`}
          confirmLabel="Sim, Excluir Etapa"
          cancelLabel="Cancelar"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setStageToDelete(null)}
          isDanger
        />
      )}
    </div>
  );
};
