import React, { useState } from 'react';
import { 
  HardHat, 
  Plus, 
  Search, 
  Phone, 
  Users, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  Layers, 
  TrendingUp, 
  Award 
} from 'lucide-react';
import { InstallationTeam, WorkProject } from '../types';
import { formatKg } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface TeamsViewProps {
  teams: InstallationTeam[];
  projects: WorkProject[];
  onSaveTeam: (team: InstallationTeam) => void;
  onDeleteTeam: (teamId: string) => void;
  canManageTeams: boolean;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  projects,
  onSaveTeam,
  onDeleteTeam,
  canManageTeams,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<InstallationTeam | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<InstallationTeam | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [leader, setLeader] = useState('');
  const [membersCount, setMembersCount] = useState<number>(4);
  const [phone, setPhone] = useState('');
  const [specialitiesStr, setSpecialitiesStr] = useState('Montagem de Galpões, Vigas W, Solda em Altura');
  const [status, setStatus] = useState<InstallationTeam['status']>('disponivel');
  const [productivityScore, setProductivityScore] = useState<number>(95);

  const openCreateModal = () => {
    setEditingTeam(null);
    setName('');
    setLeader('');
    setMembersCount(4);
    setPhone('');
    setSpecialitiesStr('Montagem de Estruturas, Solda MIG, Içamento');
    setStatus('disponivel');
    setProductivityScore(95);
    setIsModalOpen(true);
  };

  const openEditModal = (team: InstallationTeam) => {
    setEditingTeam(team);
    setName(team.name);
    setLeader(team.leader);
    setMembersCount(team.membersCount);
    setPhone(team.phone);
    setSpecialitiesStr(team.specialities.join(', '));
    setStatus(team.status);
    setProductivityScore(team.productivityScore);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !leader.trim()) return;

    const specs = specialitiesStr.split(',').map(s => s.trim()).filter(Boolean);

    const newTeam: InstallationTeam = {
      id: editingTeam ? editingTeam.id : `team-${Date.now()}`,
      name: name.trim(),
      leader: leader.trim(),
      membersCount: Number(membersCount),
      phone: phone.trim(),
      specialities: specs.length ? specs : ['Montagem Geral'],
      status,
      productivityScore: Number(productivityScore),
    };

    onSaveTeam(newTeam);
    setIsModalOpen(false);
  };

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HardHat className="w-5 h-5 text-orange-600" />
            Equipes de Montagem & Instalação em Campo
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Serralheiros industriais, soldadores qualificados, mestres de obras e instaladores
          </p>
        </div>

        {canManageTeams && (
          <button
            id="btn-new-team"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Equipe</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por equipe, encarregado ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((team) => {
          const activeProjects = projects.filter(p => p.teamId === team.id && p.status !== 'finalizada');
          const completedProjects = projects.filter(p => p.teamId === team.id && p.status === 'finalizada');
          const totalSteelHandled = projects.filter(p => p.teamId === team.id).reduce((acc, p) => acc + p.steelWeightKg, 0);

          return (
            <div
              key={team.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-orange-300 dark:hover:border-orange-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    team.status === 'em_campo'
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200'
                      : team.status === 'disponivel'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {team.status === 'em_campo' ? '⚡ Em Campo / Instalando' : team.status === 'disponivel' ? '✓ Disponível na Fábrica' : 'Em Manutenção'}
                  </span>

                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-black font-mono">
                    <Award className="w-3.5 h-3.5" />
                    <span>{team.productivityScore} pts</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {team.name}
                </h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white">Líder:</span> {team.leader}
                </p>

                <div className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{team.membersCount} Integrantes / Montadores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{team.phone}</span>
                  </div>
                </div>

                {/* Specialities Chips */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {team.specialities.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Active Works summary */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Obras em execução:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {activeProjects.length} obra(s)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Total de Aço Montado:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatKg(totalSteelHandled)}
                    </span>
                  </div>
                </div>
              </div>

              {canManageTeams && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 text-[10px] font-semibold">
                    {completedProjects.length} entregas concluídas
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(team)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar equipe"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTeamToDelete(team)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Excluir equipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Create/Edit Team */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingTeam ? 'Editar Equipe' : 'Nova Equipe de Montagem'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Equipe Echo - Portões e Grades"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Encarregado / Líder *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do líder"
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qtd de Integrantes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={membersCount}
                    onChange={(e) => setMembersCount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone de Campo
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Atual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="disponivel">Disponível na Fábrica</option>
                    <option value="em_campo">Em Campo / Instalando</option>
                    <option value="em_manutencao">Em Manutenção / Treinamento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Especialidades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Galpões, Mezaninos, Solda TIG, Içamento"
                  value={specialitiesStr}
                  onChange={(e) => setSpecialitiesStr(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{editingTeam ? 'Salvar Alterações' : 'Cadastrar Equipe'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Team Modal */}
      <ConfirmModal
        isOpen={Boolean(teamToDelete)}
        title="Excluir Equipe"
        message={`Deseja realmente excluir a equipe "${teamToDelete?.name}"? Esta ação removerá a equipe de montagem.`}
        confirmLabel="Sim, Excluir"
        confirmVariant="danger"
        onConfirm={() => {
          if (teamToDelete) {
            onDeleteTeam(teamToDelete.id);
            setTeamToDelete(null);
          }
        }}
        onCancel={() => setTeamToDelete(null)}
      />
    </div>
  );
};
