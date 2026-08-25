import React from 'react';
import { 
  LayoutDashboard, 
  Building2,
  Factory, 
  Users, 
  BadgePercent, 
  HardHat, 
  BarChart3, 
  Settings, 
  Activity,
  Scale,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { UserRole, SystemUser } from '../types';
import { NavTab, ROLE_DEFINITIONS } from '../services/storage';

export type { NavTab };

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  statusCounts?: {
    totalObras: number;
    entrada: number;
    producao: number;
    acabamento: number;
    aguardando_entrega: number;
    instalacao: number;
    finalizada: number;
  };
  activeRole?: UserRole;
  currentUser?: SystemUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  statusCounts,
  activeRole = 'admin',
  currentUser,
}) => {
  const activeWorksCount = (statusCounts?.producao || 0) + (statusCounts?.acabamento || 0) + (statusCounts?.instalacao || 0);
  const totalWorksCount = statusCounts?.totalObras || 0;

  const roleConfig = ROLE_DEFINITIONS[activeRole] || ROLE_DEFINITIONS.admin;
  const allowedTabs = roleConfig.allowedTabs;

  const allNavItems: { 
    id: NavTab; 
    label: string; 
    customLabelByRole?: Partial<Record<UserRole, string>>;
    icon: React.ComponentType<{ className?: string }>; 
    badge?: number; 
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard de Indicadores',
      icon: LayoutDashboard,
    },
    {
      id: 'obras',
      label: 'Controle de Obras',
      customLabelByRole: {
        orcamentista: 'Controle de Obras (Propostas)',
        vendedor: 'Minhas Obras (Consulta)',
      },
      icon: Building2,
      badge: totalWorksCount,
      badgeColor: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
    },
    {
      id: 'producao',
      label: 'Fluxo de Produção',
      customLabelByRole: {
        orcamentista: 'Fluxo de Produção (Consulta)',
        vendedor: 'Fluxo de Produção (Minhas Obras)',
      },
      icon: Factory,
      badge: activeWorksCount,
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    },
    {
      id: 'desempenho_interno',
      label: 'Desempenho Interno',
      icon: Activity,
    },
    {
      id: 'clientes',
      label: 'Cadastro de Clientes',
      icon: Users,
    },
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      icon: Scale,
    },
    {
      id: 'vendedores',
      label: 'Cadastro de Vendedores',
      icon: BadgePercent,
    },
    {
      id: 'equipes',
      label: 'Equipes de Montagem',
      icon: HardHat,
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: BarChart3,
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
    },
  ];

  // Filter items strictly allowed for this role
  const visibleNavItems = allNavItems.filter((item) => allowedTabs.includes(item.id));

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors">
      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Módulos Autorizados
          </span>
          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
            {visibleNavItems.length} {visibleNavItems.length === 1 ? 'módulo' : 'módulos'}
          </span>
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const displayLabel = (item.customLabelByRole && item.customLabelByRole[activeRole]) || item.label;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 dark:hover:text-orange-400'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                }`} />
                <span className="truncate">{displayLabel}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  isActive
                    ? 'bg-white text-orange-600'
                    : (item.badgeColor || 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role & Security Status Card in Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              Nível de Acesso
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              RBAC Ativo
            </span>
          </div>
          <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">
            {roleConfig.shortLabel}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
            {roleConfig.description}
          </p>
        </div>
      </div>
    </aside>
  );
};
