import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building2, 
  Check, 
  X,
  Lock,
  Eye,
  Sliders,
  Briefcase,
  Share2,
  Copy,
  ExternalLink,
  Globe,
  Maximize2
} from 'lucide-react';
import { SystemUser, UserRole, Seller } from '../types';
import { ROLE_DEFINITIONS } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';
import { ShareAppModal } from './ShareAppModal';
import { getPublicShareUrl } from '../utils/shareUtils';

interface UsersManagementSettingsProps {
  users: SystemUser[];
  sellers?: Seller[];
  onSaveUser: (user: SystemUser) => void;
  onDeleteUser: (userId: string) => void;
  canManageUsers: boolean;
}

export const UsersManagementSettings: React.FC<UsersManagementSettingsProps> = ({
  users,
  sellers = [],
  onSaveUser,
  onDeleteUser,
  canManageUsers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);

  // Standalone App Public URL for sharing
  const shareUrl = getPublicShareUrl();

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar link', err);
    }
  };

  const handleOpenFullscreen = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    department: string;
    phone: string;
    active: boolean;
    linkedSellerId?: string;
  }>({
    name: '',
    email: '',
    role: 'orcamentista',
    department: '',
    phone: '',
    active: true,
    linkedSellerId: '',
  });

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'orcamentista',
      department: 'Orçamentos & Comercial',
      phone: '',
      active: true,
      linkedSellerId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      active: user.active,
      linkedSellerId: (user as any).linkedSellerId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    const userPayload: SystemUser = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      department: formData.department.trim() || 'Operações',
      phone: formData.phone.trim(),
      active: formData.active,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().split('T')[0],
      lastLogin: editingUser?.lastLogin,
      ...(formData.linkedSellerId ? { linkedSellerId: formData.linkedSellerId } : {}),
    } as SystemUser;

    onSaveUser(userPayload);
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const roleList: { role: UserRole; title: string; desc: string; color: string; icon: any }[] = [
    {
      role: 'admin',
      title: 'Administrador',
      desc: 'Acesso total e irrestrito ao sistema e cadastro de usuários',
      color: 'border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300',
      icon: ShieldCheck
    },
    {
      role: 'supervisor',
      title: 'Supervisor',
      desc: 'Acesso total aos módulos, exceto ao módulo de Configurações',
      color: 'border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300',
      icon: Sliders
    },
    {
      role: 'projetos',
      title: 'Projetos',
      desc: 'Acesso total ao sistema, exceto ao submenu de Cadastro de Usuários',
      color: 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
      icon: Briefcase
    },
    {
      role: 'orcamentista',
      title: 'Orçamentista',
      desc: 'Acesso a Clientes e Controle de Obras, com visualização da Produção',
      color: 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
      icon: Edit
    },
    {
      role: 'vendedor',
      title: 'Vendedor',
      desc: 'Visualização exclusiva das suas obras no Fluxo de Produção',
      color: 'border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
      icon: Eye
    }
  ];

  return (
    <div className="space-y-6">
      {/* CARD DE COMPARTILHAMENTO DO SISTEMA EM TELA GRANDE (SEM CÓDIGO FONTE) */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-600/10 border-2 border-orange-500/40 dark:border-orange-500/30 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-md shadow-orange-600/20 shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Link de Compartilhamento do Sistema (Tela Grande / Sem Código-Fonte)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Acesso Protegido para Colaboradores
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Envie este link para sua equipe (Vendedores, Orçamentistas, Supervisores, Montadores e Clientes). Ao abrir, o sistema roda em <strong>tela inteira (modo aplicação)</strong> sem exibir o código-fonte ou painel de edição do Google AI Studio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              id="btn-open-share-modal"
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-orange-50 dark:hover:bg-slate-700 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Maximize2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Instruções & Detalhes</span>
            </button>

            <button
              id="btn-open-fullscreen-direct"
              type="button"
              onClick={handleOpenFullscreen}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir em Tela Cheia</span>
            </button>
          </div>
        </div>

        {/* Link Input with Quick Copy */}
        <div className="bg-white dark:bg-slate-900/90 border border-orange-200 dark:border-orange-900/50 rounded-xl p-2.5 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-users-menu-share-url"
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden select-all"
            />
          </div>

          <button
            id="btn-users-menu-copy-share-url"
            type="button"
            onClick={handleCopyLink}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              copiedLink
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Link do Sistema</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overview Cards of System Roles */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-orange-600" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Matriz de Perfis e Níveis de Acesso
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {roleList.map((item) => {
            const Icon = item.icon;
            const count = users.filter(u => u.role === item.role).length;
            return (
              <div 
                key={item.role} 
                className={`p-3.5 rounded-xl border ${item.color} flex flex-col justify-between transition-all hover:scale-[1.01]`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-black text-xs flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      {item.title}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80">
                      {count} {count === 1 ? 'usuário' : 'usuários'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Table and Management Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Usuários Cadastrados ({filteredUsers.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gerencie os usuários do sistema, departamentos e permissões de acesso
            </p>
          </div>

          {canManageUsers && (
            <button
              id="btn-add-new-user"
              type="button"
              onClick={handleOpenNewUser}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-users"
              type="text"
              placeholder="Buscar por nome, e-mail ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              id="select-filter-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todos os Perfis</option>
              <option value="admin">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="projetos">Projetos</option>
              <option value="orcamentista">Orçamentista</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Contato & E-mail</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Perfil de Acesso</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canManageUsers && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.orcamentista;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{user.department || 'Geral'}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleDef.badgeColor}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {roleDef.name}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {canManageUsers && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-edit-user-${user.id}`}
                              type="button"
                              onClick={() => handleOpenEditUser(user)}
                              title="Editar Usuário"
                              className="p-1.5 text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-user-${user.id}`}
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              title="Excluir Usuário"
                              className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRIAR / EDITAR USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  id="modal-input-name"
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail de Acesso *
                  </label>
                  <input
                    id="modal-input-email"
                    type="email"
                    required
                    placeholder="carlos@empresa.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / Celular
                  </label>
                  <input
                    id="modal-input-phone"
                    type="text"
                    placeholder="(11) 98888-7777"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento / Setor
                  </label>
                  <input
                    id="modal-input-dept"
                    type="text"
                    placeholder="Ex: Engenharia / Vendas"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Perfil de Acesso *
                  </label>
                  <select
                    id="modal-select-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="admin">Administrador (Acesso Total)</option>
                    <option value="supervisor">Supervisor (Total sem Configurações)</option>
                    <option value="projetos">Projetos (Total sem Usuários)</option>
                    <option value="orcamentista">Orçamentista (Clientes, Obras & Produção)</option>
                    <option value="vendedor">Vendedor (Visualização das Obras)</option>
                  </select>
                </div>
              </div>

              {/* Se o perfil for Vendedor, permite vincular ao cadastro de Vendedor */}
              {formData.role === 'vendedor' && sellers.length > 0 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                    Vincular ao Cadastro de Vendedor Comercial
                  </label>
                  <select
                    id="modal-select-seller-link"
                    value={formData.linkedSellerId || ''}
                    onChange={(e) => setFormData({ ...formData, linkedSellerId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione o vendedor correspondente...</option>
                    {sellers.map(sel => (
                      <option key={sel.id} value={sel.id}>
                        {sel.name} ({sel.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-1">
                    Este vínculo garante que o usuário visualize apenas as obras negociadas por este vendedor.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    id="modal-check-active"
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                  />
                  <span>Usuário Ativo (Pode acessar o sistema)</span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="modal-btn-submit-user"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      {userToDelete && (
        <ConfirmModal
          isOpen={Boolean(userToDelete)}
          title="Excluir Usuário"
          message={`Tem certeza que deseja excluir o usuário ${userToDelete.name} (${userToDelete.email})?`}
          confirmLabel="Excluir Usuário"
          onConfirm={() => {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
          }}
          onCancel={() => setUserToDelete(null)}
        />
      )}

      {/* MODAL DE COMPARTILHAMENTO & ACESSO EM TELA GRANDE */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
