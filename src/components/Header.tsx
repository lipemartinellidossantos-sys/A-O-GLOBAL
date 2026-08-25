import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Plus, 
  ShieldCheck, 
  Layers,
  Menu,
  DollarSign,
  UserCheck,
  Share2,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { UserRole, SystemSettings, Seller, SystemUser } from '../types';
import { StorageService, ROLE_DEFINITIONS } from '../services/storage';
import { ShareAppModal } from './ShareAppModal';

interface HeaderProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNewWorkModal: () => void;
  canCreateWork: boolean;
  onOpenNewTransactionModal?: () => void;
  onToggleMobileMenu?: () => void;
  settings?: SystemSettings;
  sellers?: Seller[];
  selectedSellerId?: string;
  onSelectSeller?: (sellerId: string) => void;
  users?: SystemUser[];
  currentUser?: SystemUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onRoleChange,
  darkMode,
  onToggleDarkMode,
  onOpenNewWorkModal,
  canCreateWork,
  onOpenNewTransactionModal,
  onToggleMobileMenu,
  settings,
  sellers = [],
  selectedSellerId = '',
  onSelectSeller = (_sellerId: string) => {},
  currentUser,
  onLogout,
}) => {
  const currentSettings = settings || StorageService.getSettings();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile menu toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              id="btn-mobile-menu"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  AÇO<span className="text-orange-600 dark:text-orange-500">GESTÃO</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                {currentSettings?.tradeName || 'Serralheria Industrial & Estruturas Metálicas'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Role Selector, Seller Filter & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* SELETOR DE VENDEDOR CADASTRADO (Quando o perfil for Vendedor) */}
          {activeRole === 'vendedor' && sellers.length > 0 && (
            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 rounded-xl px-2.5 py-1">
              <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-wider text-purple-700 dark:text-purple-300 leading-none">
                  Vendedor Vinculado
                </span>
                {currentUser?.role === 'admin' ? (
                  <select
                    id="select-header-seller"
                    value={selectedSellerId}
                    onChange={(e) => onSelectSeller(e.target.value)}
                    aria-label="Selecionar Vendedor Cadastrado"
                    className="bg-transparent text-xs font-bold text-purple-950 dark:text-purple-100 focus:outline-hidden cursor-pointer pr-1"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      Todos os Vendedores
                    </option>
                    {sellers.map((sel) => (
                      <option 
                        key={sel.id} 
                        value={sel.id}
                        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        {sel.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-purple-950 dark:text-purple-100 truncate max-w-[140px]">
                    {sellers.find(s => s.id === selectedSellerId)?.name || currentUser?.name || 'Vendedor'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Action: Nova Obra */}
          {canCreateWork && (
            <button
              id="btn-header-new-project"
              onClick={onOpenNewWorkModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Obra</span>
              <span className="sm:hidden">Obra</span>
            </button>
          )}

          {/* User & Role Badge or Selector */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
            <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                Perfil de Acesso
              </span>
              {currentUser?.role === 'admin' ? (
                <select
                  id="select-user-role"
                  value={activeRole}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  aria-label="Perfil de Acesso do Usuário"
                  className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden cursor-pointer pr-1"
                >
                  <option value="admin" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Administrador (Acesso Total)
                  </option>
                  <option value="supervisor" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Supervisor (Acesso Geral sem Configurações)
                  </option>
                  <option value="projetos" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Projetos (Acesso Total sem Gestão de Usuários)
                  </option>
                  <option value="orcamentista" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Orçamentista (Clientes, Obras & Consulta Produção)
                  </option>
                  <option value="vendedor" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Vendedor (Visualização das Obras do Vendedor)
                  </option>
                </select>
              ) : (
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                  {ROLE_DEFINITIONS[activeRole]?.name || activeRole}
                </span>
              )}
            </div>
          </div>

          {/* Logged-in Google User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 max-w-[200px] sm:max-w-xs">
                {currentUser.googleAccount?.picture ? (
                  <img
                    src={currentUser.googleAccount.picture}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate leading-none">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  id="btn-header-logout"
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Sair da Conta Google (Desconectar)"
                  aria-label="Sair da Conta Google"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-bold hidden md:inline">Sair</span>
                </button>
              )}
            </div>
          )}

          {/* Share System Link Button */}
          <button
            id="btn-header-share-app"
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-800/80 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Compartilhar Link do Sistema (Tela Grande sem Código-Fonte)"
            aria-label="Compartilhar Link do Sistema"
          >
            <Share2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-bold hidden xl:inline text-orange-900 dark:text-orange-200">
              Compartilhar
            </span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="btn-toggle-dark-mode"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            aria-label="Alternar modo claro e escuro"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Share App Modal */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        appName={currentSettings?.tradeName || 'AÇO GESTÃO PRO'}
      />
    </header>
  );
};
