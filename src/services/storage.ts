import { 
  WorkProject, 
  Client, 
  Supplier, 
  Seller, 
  InstallationTeam, 
  FinancialTransaction, 
  RolePermission, 
  SystemSettings,
  WorkStatus,
  UserRole,
  SystemUser,
  FactoryStageConfig,
  InternalProductionTeam,
  ProductionDailyLog,
  StructureTypeConfig
} from '../types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_PERMISSIONS, 
  INITIAL_CLIENTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_SELLERS, 
  INITIAL_TEAMS, 
  INITIAL_PROJECTS, 
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
  INITIAL_FACTORY_STAGES,
  INITIAL_INTERNAL_TEAMS,
  INITIAL_PRODUCTION_LOGS,
  INITIAL_STRUCTURE_TYPES
} from '../data/mockData';

const STORAGE_KEYS = {
  PROJECTS: 'acogestao_projects_v2',
  CLIENTS: 'acogestao_clients_v2',
  SUPPLIERS: 'acogestao_suppliers_v2',
  SELLERS: 'acogestao_sellers_v2',
  TEAMS: 'acogestao_teams_v2',
  INTERNAL_TEAMS: 'acogestao_internal_teams_v2',
  PRODUCTION_LOGS: 'acogestao_production_logs_v2',
  TRANSACTIONS: 'acogestao_transactions_v2',
  SETTINGS: 'acogestao_settings_v2',
  PERMISSIONS: 'acogestao_permissions_v2',
  USERS: 'acogestao_users_v2',
  FACTORY_STAGES: 'acogestao_factory_stages_v2',
  STRUCTURE_TYPES: 'acogestao_structure_types_v2',
  ACTIVE_ROLE: 'acogestao_active_role_v2',
  CURRENT_USER: 'acogestao_current_user_v2',
  DARK_MODE: 'acogestao_dark_mode_v2',
};

export const StorageService = {
  getProjects: (): WorkProject[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  },
  saveProjects: (projects: WorkProject[]) => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  getClients: (): Client[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return data ? JSON.parse(data) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  },
  saveClients: (clients: Client[]) => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },

  getSuppliers: (): Supplier[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return data ? JSON.parse(data) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  },
  saveSuppliers: (suppliers: Supplier[]) => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  },

  getSellers: (): Seller[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SELLERS);
      return data ? JSON.parse(data) : INITIAL_SELLERS;
    } catch {
      return INITIAL_SELLERS;
    }
  },
  saveSellers: (sellers: Seller[]) => {
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellers));
  },

  getTeams: (): InstallationTeam[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
      return data ? JSON.parse(data) : INITIAL_TEAMS;
    } catch {
      return INITIAL_TEAMS;
    }
  },
  saveTeams: (teams: InstallationTeam[]) => {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  },

  getTransactions: (): FinancialTransaction[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const parsed: FinancialTransaction[] = data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
      // Keep only revenue from projects, discarding any legacy expenses
      return parsed.filter(t => t.type === 'receita');
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },
  saveTransactions: (transactions: FinancialTransaction[]) => {
    // Only save revenue transactions
    const revenuesOnly = transactions.filter(t => t.type === 'receita');
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(revenuesOnly));
  },

  getInternalTeams: (): InternalProductionTeam[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INTERNAL_TEAMS);
      return data ? JSON.parse(data) : INITIAL_INTERNAL_TEAMS;
    } catch {
      return INITIAL_INTERNAL_TEAMS;
    }
  },
  saveInternalTeams: (teams: InternalProductionTeam[]) => {
    localStorage.setItem(STORAGE_KEYS.INTERNAL_TEAMS, JSON.stringify(teams));
  },

  getProductionLogs: (): ProductionDailyLog[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTION_LOGS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTION_LOGS;
    } catch {
      return INITIAL_PRODUCTION_LOGS;
    }
  },
  saveProductionLogs: (logs: ProductionDailyLog[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_LOGS, JSON.stringify(logs));
  },

  getFactoryStages: (): FactoryStageConfig[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FACTORY_STAGES);
      if (data) {
        const parsed: FactoryStageConfig[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize first stage to always be "1. Ordem de Produção Pronta para Descer para Fábrica"
          const sorted = [...parsed].sort((a, b) => a.order - b.order);
          if (sorted[0]) {
            if (!sorted[0].name.toLowerCase().includes('pronta') && !sorted[0].name.toLowerCase().includes('fábrica')) {
              sorted[0] = {
                ...sorted[0],
                name: '1. Ordem de Produção Pronta para Descer para Fábrica',
                description: 'Ordem de serviço liberada pela engenharia e pronta para iniciar a fabricação na fábrica.',
                statusMapping: 'entrada',
              };
            }
          }
          return sorted;
        }
      }
      return INITIAL_FACTORY_STAGES;
    } catch {
      return INITIAL_FACTORY_STAGES;
    }
  },
  saveFactoryStages: (stages: FactoryStageConfig[]) => {
    localStorage.setItem(STORAGE_KEYS.FACTORY_STAGES, JSON.stringify(stages));
  },

  getStructureTypes: (): StructureTypeConfig[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STRUCTURE_TYPES);
      return data ? JSON.parse(data) : INITIAL_STRUCTURE_TYPES;
    } catch {
      return INITIAL_STRUCTURE_TYPES;
    }
  },
  saveStructureTypes: (types: StructureTypeConfig[]) => {
    localStorage.setItem(STORAGE_KEYS.STRUCTURE_TYPES, JSON.stringify(types));
  },

  getSettings: (): SystemSettings => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  },
  saveSettings: (settings: SystemSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getPermissions: (): RolePermission[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      return data ? JSON.parse(data) : INITIAL_PERMISSIONS;
    } catch {
      return INITIAL_PERMISSIONS;
    }
  },
  savePermissions: (permissions: RolePermission[]) => {
    localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
  },

  getUsers: (): SystemUser[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) return INITIAL_USERS;
      const parsed: SystemUser[] = JSON.parse(data);
      // Ensure master admins exist
      let updated = [...parsed];
      let hasChanges = false;
      const adminEmails = ['lipe.martinellidossantos@gmail.com', 'felipesistema79@gmail.com'];
      for (const email of adminEmails) {
        if (!updated.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          const adminUser = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (adminUser) {
            updated = [adminUser, ...updated];
            hasChanges = true;
          }
        }
      }
      if (hasChanges) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
        return updated;
      }
      return parsed;
    } catch {
      return INITIAL_USERS;
    }
  },
  saveUsers: (users: SystemUser[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser: (): SystemUser | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch {
      return null;
    }
  },
  saveCurrentUser: (user: SystemUser | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getActiveRole: (): UserRole => {
    try {
      const currentUser = StorageService.getCurrentUser();
      if (currentUser) {
        return currentUser.role;
      }
      const role = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      return (role as UserRole) || 'admin';
    } catch {
      return 'admin';
    }
  },
  saveActiveRole: (role: UserRole) => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
  },

  getDarkMode: (): boolean => {
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return mode !== null ? mode === 'true' : false;
    } catch {
      return false;
    }
  },
  saveDarkMode: (isDark: boolean) => {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, isDark ? 'true' : 'false');
  },

  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.SELLERS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.INTERNAL_TEAMS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTION_LOGS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.FACTORY_STAGES);
    localStorage.removeItem(STORAGE_KEYS.STRUCTURE_TYPES);
  },

  exportBackup: () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects: StorageService.getProjects(),
      clients: StorageService.getClients(),
      suppliers: StorageService.getSuppliers(),
      sellers: StorageService.getSellers(),
      teams: StorageService.getTeams(),
      internalTeams: StorageService.getInternalTeams(),
      productionLogs: StorageService.getProductionLogs(),
      transactions: StorageService.getTransactions(),
      settings: StorageService.getSettings(),
      permissions: StorageService.getPermissions(),
      users: StorageService.getUsers(),
      factoryStages: StorageService.getFactoryStages(),
      structureTypes: StorageService.getStructureTypes(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_acogestao_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.projects) StorageService.saveProjects(parsed.projects);
      if (parsed.clients) StorageService.saveClients(parsed.clients);
      if (parsed.suppliers) StorageService.saveSuppliers(parsed.suppliers);
      if (parsed.sellers) StorageService.saveSellers(parsed.sellers);
      if (parsed.teams) StorageService.saveTeams(parsed.teams);
      if (parsed.internalTeams) StorageService.saveInternalTeams(parsed.internalTeams);
      if (parsed.productionLogs) StorageService.saveProductionLogs(parsed.productionLogs);
      if (parsed.transactions) StorageService.saveTransactions(parsed.transactions);
      if (parsed.settings) StorageService.saveSettings(parsed.settings);
      if (parsed.permissions) StorageService.savePermissions(parsed.permissions);
      if (parsed.users) StorageService.saveUsers(parsed.users);
      if (parsed.factoryStages) StorageService.saveFactoryStages(parsed.factoryStages);
      if (parsed.structureTypes) StorageService.saveStructureTypes(parsed.structureTypes);
      return true;
    } catch {
      return false;
    }
  },
};

export const getFactoryStages = StorageService.getFactoryStages;

export type NavTab = 
  | 'dashboard' 
  | 'obras'
  | 'producao'
  | 'desempenho_interno'
  | 'clientes' 
  | 'fornecedores'
  | 'vendedores' 
  | 'equipes' 
  | 'relatorios' 
  | 'configuracoes';

export interface RoleConfig {
  name: string;
  shortLabel: string;
  description: string;
  badgeColor: string;
  allowedTabs: NavTab[];
  canCreateWork: boolean;
  canEditWork: boolean;
  canDeleteWork: boolean;
  canAdvanceKanban: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canManageClients: boolean;
  canManageSellers: boolean;
  canManageTeams: boolean;
  canExportReports: boolean;
  isReadOnlySellerKanban?: boolean;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleConfig> = {
  admin: {
    name: 'Administrador',
    shortLabel: 'Administrador (Acesso Total)',
    description: 'Acesso master total e irrestrito a todos os módulos do sistema e ao cadastro de usuários.',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    allowedTabs: ['dashboard', 'obras', 'producao', 'desempenho_interno', 'clientes', 'fornecedores', 'vendedores', 'equipes', 'relatorios', 'configuracoes'],
    canCreateWork: true,
    canEditWork: true,
    canDeleteWork: true,
    canAdvanceKanban: true,
    canManageUsers: true,
    canManageSettings: true,
    canManageClients: true,
    canManageSellers: true,
    canManageTeams: true,
    canExportReports: true,
  },
  supervisor: {
    name: 'Supervisor',
    shortLabel: 'Supervisor (Acesso Geral sem Configurações)',
    description: 'Acesso total aos módulos operacionais de obras, produção, clientes, fornecedores, equipes e relatórios. Sem acesso a configurações.',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    allowedTabs: ['dashboard', 'obras', 'producao', 'desempenho_interno', 'clientes', 'fornecedores', 'vendedores', 'equipes', 'relatorios'],
    canCreateWork: true,
    canEditWork: true,
    canDeleteWork: true,
    canAdvanceKanban: true,
    canManageUsers: false,
    canManageSettings: false,
    canManageClients: true,
    canManageSellers: true,
    canManageTeams: true,
    canExportReports: true,
  },
  projetos: {
    name: 'Projetos',
    shortLabel: 'Projetos (Acesso Total sem Gestão de Usuários)',
    description: 'Acesso total ao sistema e ao módulo de configurações técnicas, sem acesso ao submenu de cadastro de usuários.',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    allowedTabs: ['dashboard', 'obras', 'producao', 'desempenho_interno', 'clientes', 'fornecedores', 'vendedores', 'equipes', 'relatorios', 'configuracoes'],
    canCreateWork: true,
    canEditWork: true,
    canDeleteWork: true,
    canAdvanceKanban: true,
    canManageUsers: false,
    canManageSettings: true,
    canManageClients: true,
    canManageSellers: true,
    canManageTeams: true,
    canExportReports: true,
  },
  orcamentista: {
    name: 'Orçamentista',
    shortLabel: 'Orçamentista (Clientes, Obras & Consulta Produção)',
    description: 'Acesso somente ao Cadastro de Clientes e Controle de Obras, e visualização em modo de consulta do Fluxo de Produção.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    allowedTabs: ['clientes', 'obras', 'producao'],
    canCreateWork: true,
    canEditWork: true,
    canDeleteWork: false,
    canAdvanceKanban: false,
    canManageUsers: false,
    canManageSettings: false,
    canManageClients: true,
    canManageSellers: false,
    canManageTeams: false,
    canExportReports: false,
  },
  vendedor: {
    name: 'Vendedor',
    shortLabel: 'Vendedor (Visualização das Obras do Vendedor)',
    description: 'Permite selecionar o vendedor cadastrado e apenas visualizar o Fluxo de Produção e suas Obras filtradas.',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    allowedTabs: ['producao', 'obras'],
    canCreateWork: false,
    canEditWork: false,
    canDeleteWork: false,
    canAdvanceKanban: false,
    canManageUsers: false,
    canManageSettings: false,
    canManageClients: false,
    canManageSellers: false,
    canManageTeams: false,
    canExportReports: false,
    isReadOnlySellerKanban: true,
  },
  // Aliases para compatibilidade
  gerente_pcp: {
    name: 'Projetos',
    shortLabel: 'Projetos (Acesso Total sem Gestão de Usuários)',
    description: 'Acesso total ao sistema e ao módulo de configurações técnicas, sem acesso ao submenu de cadastro de usuários.',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    allowedTabs: ['dashboard', 'obras', 'producao', 'desempenho_interno', 'clientes', 'fornecedores', 'vendedores', 'equipes', 'relatorios', 'configuracoes'],
    canCreateWork: true,
    canEditWork: true,
    canDeleteWork: true,
    canAdvanceKanban: true,
    canManageUsers: false,
    canManageSettings: true,
    canManageClients: true,
    canManageSellers: true,
    canManageTeams: true,
    canExportReports: true,
  },
  lider_montagem: {
    name: 'Orçamentista',
    shortLabel: 'Orçamentista (Clientes, Obras & Consulta Produção)',
    description: 'Acesso somente ao Cadastro de Clientes e Controle de Obras, e visualização em modo de consulta do Fluxo de Produção.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    allowedTabs: ['clientes', 'obras', 'producao'],
    canCreateWork: true,
    canEditWork: true,
    canDeleteWork: false,
    canAdvanceKanban: false,
    canManageUsers: false,
    canManageSettings: false,
    canManageClients: true,
    canManageSellers: false,
    canManageTeams: false,
    canExportReports: false,
  },
  financeiro: {
    name: 'Supervisor',
    shortLabel: 'Supervisor',
    description: 'Acesso aos módulos operacionais.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    allowedTabs: ['dashboard', 'obras', 'producao', 'desempenho_interno', 'clientes', 'fornecedores', 'vendedores', 'equipes', 'relatorios'],
    canCreateWork: true,
    canEditWork: true,
    canDeleteWork: true,
    canAdvanceKanban: true,
    canManageUsers: false,
    canManageSettings: false,
    canManageClients: true,
    canManageSellers: true,
    canManageTeams: true,
    canExportReports: true,
  }
};

export const STATUS_LABELS: Record<WorkStatus, { label: string; color: string; bg: string; darkBg: string; border: string }> = {
  nao_iniciada: { 
    label: 'Aguardando OS', 
    color: 'text-slate-700 dark:text-slate-300', 
    bg: 'bg-slate-100', 
    darkBg: 'dark:bg-slate-800/70',
    border: 'border-slate-300 dark:border-slate-700'
  },
  entrada: { 
    label: '1. Ordem Pronta para Fábrica', 
    color: 'text-amber-700 dark:text-amber-300', 
    bg: 'bg-amber-50', 
    darkBg: 'dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/60'
  },
  producao: { 
    label: '2. Corte, Solda & Fabricação', 
    color: 'text-orange-700 dark:text-orange-300', 
    bg: 'bg-orange-50', 
    darkBg: 'dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800/60'
  },
  acabamento: { 
    label: '3. Pintura & Tratamento', 
    color: 'text-blue-700 dark:text-blue-300', 
    bg: 'bg-blue-50', 
    darkBg: 'dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/60'
  },
  aguardando_entrega: { 
    label: '4. Separação & Expedição', 
    color: 'text-purple-700 dark:text-purple-300', 
    bg: 'bg-purple-50', 
    darkBg: 'dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/60'
  },
  instalacao: { 
    label: '5. Instalação & Montagem', 
    color: 'text-cyan-700 dark:text-cyan-300', 
    bg: 'bg-cyan-50', 
    darkBg: 'dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-800/60'
  },
  finalizada: { 
    label: '6. Entregue & Concluída', 
    color: 'text-emerald-700 dark:text-emerald-300', 
    bg: 'bg-emerald-50', 
    darkBg: 'dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/60'
  },
};

export const addBusinessDays = (startDateStr: string, businessDays: number): string => {
  if (!startDateStr || isNaN(businessDays) || businessDays <= 0) {
    return startDateStr || new Date().toISOString().split('T')[0];
  }
  try {
    const [year, month, day] = startDateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    let added = 0;
    while (added < businessDays) {
      date.setDate(date.getDate() + 1);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return startDateStr;
  }
};

export const calculateProgressForStatus = (status: WorkStatus, customStages?: FactoryStageConfig[]): number => {
  if (status === 'nao_iniciada') return 0;
  if (status === 'finalizada') return 100;

  if (customStages && customStages.length > 1) {
    const sorted = [...customStages].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.statusMapping === status);
    if (idx >= 0) {
      if (idx === 0) return 15; // Ordem pronta para descer para fábrica
      if (idx === sorted.length - 1) return 100;
      return Math.min(95, Math.round(15 + (idx / (sorted.length - 1)) * 80));
    }
  }

  switch (status) {
    case 'entrada':
      return 15; // Ordem Pronta para Fábrica
    case 'producao':
      return 40; // Em corte/solda
    case 'acabamento':
      return 65; // Em pintura
    case 'aguardando_entrega':
      return 85; // Expedição
    case 'instalacao':
      return 95; // Montagem em campo
    default:
      return 0;
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatKg = (kg: number): string => {
  if (kg >= 1000) {
    return `${(kg / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ton`;
  }
  return `${kg.toLocaleString('pt-BR')} kg`;
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};
