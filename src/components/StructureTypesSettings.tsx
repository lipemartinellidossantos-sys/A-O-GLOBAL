import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  Check, 
  X, 
  Package, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Building2,
  Tag,
  Boxes,
  HelpCircle
} from 'lucide-react';
import { StructureTypeConfig, WorkProject } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface StructureTypesSettingsProps {
  structureTypes: StructureTypeConfig[];
  onSaveStructureType: (type: StructureTypeConfig) => void;
  onDeleteStructureType: (typeId: string) => void;
  canManageSettings: boolean;
  projects?: WorkProject[];
}

const COLOR_TAG_OPTIONS = [
  { id: 'orange', label: 'Laranja', bg: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800' },
  { id: 'amber', label: 'Âmbar', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
  { id: 'cyan', label: 'Ciano', bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800' },
  { id: 'emerald', label: 'Verde', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
  { id: 'purple', label: 'Roxo', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800' },
  { id: 'red', label: 'Vermelho', bg: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800' },
  { id: 'slate', label: 'Cinza', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
];

const UNIT_OPTIONS: StructureTypeConfig['defaultUnit'][] = [
  'm²',
  'un',
  'm linear',
  'conjuntos',
  'peças',
  'barras',
  'chapas'
];

export const StructureTypesSettings: React.FC<StructureTypesSettingsProps> = ({
  structureTypes = [],
  onSaveStructureType,
  onDeleteStructureType,
  canManageSettings,
  projects = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplexityFilter, setSelectedComplexityFilter] = useState<string>('todos');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<StructureTypeConfig | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<StructureTypeConfig | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultUnit, setDefaultUnit] = useState<StructureTypeConfig['defaultUnit']>('m²');
  const [complexity, setComplexity] = useState<'baixa' | 'media' | 'alta' | 'especial'>('media');
  const [colorTag, setColorTag] = useState<string>('orange');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState('');

  // Statistics
  const stats = useMemo(() => {
    const activeTypes = structureTypes.filter(s => s.active);

    return {
      total: structureTypes.length,
      activeCount: activeTypes.length,
      inactiveCount: structureTypes.length - activeTypes.length,
      totalWorks: projects.length,
    };
  }, [structureTypes, projects]);

  const handleOpenNewModal = () => {
    setEditingType(null);
    setName('');
    setDescription('');
    setDefaultUnit('m²');
    setComplexity('media');
    setColorTag('orange');
    setActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (type: StructureTypeConfig) => {
    setEditingType(type);
    setName(type.name);
    setDescription(type.description || '');
    setDefaultUnit(type.defaultUnit || 'm²');
    setComplexity(type.complexity || 'media');
    setColorTag(type.colorTag || 'orange');
    setActive(type.active !== false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Informe o nome da categoria ou tipo de estrutura.');
      return;
    }

    // Check duplicate name
    const isDuplicate = structureTypes.some(
      st => st.id !== editingType?.id && st.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError('Já existe um tipo de estrutura cadastrado com este nome.');
      return;
    }

    const typeToSave: StructureTypeConfig = {
      id: editingType ? editingType.id : `st-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      defaultUnit,
      complexity,
      colorTag,
      active,
      isSystemDefault: editingType?.isSystemDefault ?? false,
    };

    onSaveStructureType(typeToSave);
    setIsModalOpen(false);
  };

  const handleToggleActive = (type: StructureTypeConfig) => {
    onSaveStructureType({
      ...type,
      active: !type.active,
    });
  };

  // Count active works for each category
  const getWorksCountForType = (typeName: string) => {
    return projects.filter(p => p.category === typeName).length;
  };

  const filteredTypes = structureTypes.filter(st => {
    const matchesSearch = 
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.description && st.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesComplexity = selectedComplexityFilter === 'todos' || st.complexity === selectedComplexityFilter;
    return matchesSearch && matchesComplexity;
  });

  const getColorClass = (tag?: string) => {
    const found = COLOR_TAG_OPTIONS.find(c => c.id === tag);
    return found ? found.bg : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800';
  };

  return (
    <div className="space-y-4">
      {/* Banner Explicativo */}
      <div className="bg-gradient-to-r from-orange-50 via-white to-amber-50 dark:from-orange-950/40 dark:via-slate-900 dark:to-amber-950/20 border border-orange-200 dark:border-orange-900/60 rounded-2xl p-4 flex flex-col md:flex-row items-start justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-600/30">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              Tipos & Categorias de Estruturas Metálicas
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-orange-600 text-white font-bold">
                {structureTypes.length} Categorias
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1 max-w-3xl">
              Cadastre, edite ou desative os tipos de estruturas atendidas pela serralheria (ex: Galpões, Mezaninos, Coberturas, Portões Industriais, Escadas). Essas categorias alimentam automaticamente o formulário de novas obras, orçamentos e relatórios de produção.
            </p>
          </div>
        </div>

        {canManageSettings && (
          <button
            id="btn-add-structure-type"
            type="button"
            onClick={handleOpenNewModal}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Tipo de Estrutura</span>
          </button>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total de Categorias
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {stats.total}
              </span>
              <span className="text-xs text-slate-500">
                cadastradas
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Categorias Ativas
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.activeCount}
              </span>
              <span className="text-xs text-slate-500">
                disponíveis para obras
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Obras no Portfólio
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                {stats.totalWorks}
              </span>
              <span className="text-xs text-slate-500">
                projetos mapeados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-structure-types"
            type="text"
            placeholder="Buscar por tipo de estrutura ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500">Complexidade:</span>
            <select
              value={selectedComplexityFilter}
              onChange={(e) => setSelectedComplexityFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todas ({structureTypes.length})</option>
              <option value="baixa">Baixa Complexidade</option>
              <option value="media">Média Complexidade</option>
              <option value="alta">Alta Complexidade</option>
              <option value="especial">Especial / Sob Medida</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structure Types Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {filteredTypes.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nenhum tipo de estrutura encontrado
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ajuste sua busca ou clique no botão acima para adicionar um novo tipo de estrutura metálica.
            </p>
          </div>
        ) : (
          filteredTypes.map((type) => {
            const worksCount = getWorksCountForType(type.name);
            const badgeStyle = getColorClass(type.colorTag);
            const unitDisplay = type.defaultUnit || 'm²';

            return (
              <div
                key={type.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all hover:border-orange-300 dark:hover:border-orange-900/60 ${
                  type.active ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeStyle}`}>
                        {type.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {type.active ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                    {type.name}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed min-h-[32px]">
                    {type.description || 'Sem descrição técnica cadastrada.'}
                  </p>

                  {/* Unidade Padrão & Informações */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Unidade de Medida Padrão</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {unitDisplay}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Obras no portfólio: <strong>{worksCount}</strong>
                    </span>

                    <span className={`capitalize font-bold text-[10px] ${
                      type.complexity === 'alta' || type.complexity === 'especial' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {type.complexity || 'media'} complexidade
                    </span>
                  </div>
                </div>

                {/* Actions Row */}
                {canManageSettings && (
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(type)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        type.active 
                          ? 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800' 
                          : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60'
                      }`}
                    >
                      {type.active ? 'Desativar' : 'Ativar'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(type)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-all cursor-pointer"
                        title="Editar Tipo de Estrutura"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setTypeToDelete(type)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                        title="Excluir Tipo de Estrutura"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Structure Type */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-white" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {editingType ? 'Editar Tipo de Estrutura' : 'Novo Tipo de Estrutura Metálica'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2 font-semibold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Estrutura / Categoria *
                </label>
                <input
                  id="input-structure-name"
                  type="text"
                  required
                  placeholder="Ex: Galpão Metálico, Mezanino Estrutural, Pipe-Rack..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição Técnica & Escopo
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva as características técnicas, componentes padrão e aplicações típicas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unidade de Medida Padrão
                  </label>
                  <select
                    id="select-structure-unit"
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-orange-500"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Grau de Complexidade
                  </label>
                  <select
                    id="select-structure-complexity"
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-orange-500"
                  >
                    <option value="baixa">Baixa (Padrão / Repetitiva)</option>
                    <option value="media">Média (Convencional)</option>
                    <option value="alta">Alta (Múltiplos Detalhes)</option>
                    <option value="especial">Especial (Sob Medida / Projeto Único)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Cor de Identificação
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_TAG_OPTIONS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setColorTag(color.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${color.bg} ${
                        colorTag === color.id ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-slate-900 scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {colorTag === color.id && <Check className="w-3 h-3" />}
                      <span>{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Status da Categoria
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Habilitada para seleção no cadastro de novas obras
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-600"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  {editingType ? 'Salvar Alterações' : 'Cadastrar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {typeToDelete && (
        <ConfirmModal
          isOpen={Boolean(typeToDelete)}
          title="Excluir Tipo de Estrutura"
          message={`Tem certeza que deseja excluir a categoria "${typeToDelete.name}"? Esta ação removerá a opção para novos orçamentos e obras.`}
          confirmLabel="Sim, Excluir"
          confirmVariant="danger"
          onConfirm={() => {
            onDeleteStructureType(typeToDelete.id);
            setTypeToDelete(null);
          }}
          onCancel={() => setTypeToDelete(null)}
        />
      )}
    </div>
  );
};
