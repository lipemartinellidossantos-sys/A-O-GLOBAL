import React, { useState, useEffect } from 'react';
import { 
  WorkProject, 
  WorkStatus, 
  FinancialTransaction, 
  Client, 
  Supplier, 
  Seller, 
  InstallationTeam, 
  SystemSettings, 
  UserRole,
  SystemUser,
  FactoryStageConfig,
  InternalProductionTeam,
  ProductionDailyLog,
  StructureTypeConfig
} from './types';
import { StorageService, calculateProgressForStatus, ROLE_DEFINITIONS } from './services/storage';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { WorkControlView } from './components/WorkControlView';
import { ProductionKanbanView } from './components/ProductionKanbanView';
import { InternalPerformanceView } from './components/InternalPerformanceView';
import { WorkDetailModal } from './components/WorkDetailModal';
import { WorkFormModal } from './components/WorkFormModal';
import { FinancialView } from './components/FinancialView';
import { TransactionModal } from './components/TransactionModal';
import { ClientsView } from './components/ClientsView';
import { SuppliersView } from './components/SuppliersView';
import { SellersView } from './components/SellersView';
import { TeamsView } from './components/TeamsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { GoogleLoginView } from './components/GoogleLoginView';

export default function App() {
  // Authentication & Session State (Google SSO)
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(StorageService.getCurrentUser());

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Role Simulation State
  const [activeRole, setActiveRole] = useState<UserRole>(StorageService.getActiveRole());

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(StorageService.getDarkMode());

  // Data Collections State
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [teams, setTeams] = useState<InstallationTeam[]>([]);
  const [internalTeams, setInternalTeams] = useState<InternalProductionTeam[]>([]);
  const [productionLogs, setProductionLogs] = useState<ProductionDailyLog[]>([]);
  const [factoryStages, setFactoryStages] = useState<FactoryStageConfig[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [structureTypes, setStructureTypes] = useState<StructureTypeConfig[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());

  // Selected Seller for filtering (especially for Vendedor role)
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');

  // Modals State
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<WorkProject | null>(null);
  const [isWorkFormModalOpen, setIsWorkFormModalOpen] = useState(false);
  const [selectedClientForNewWork, setSelectedClientForNewWork] = useState<Client | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // Initialize Data from Storage
  useEffect(() => {
    setProjects(StorageService.getProjects());
    setTransactions(StorageService.getTransactions());
    setClients(StorageService.getClients());
    setSuppliers(StorageService.getSuppliers());
    setSellers(StorageService.getSellers());
    setTeams(StorageService.getTeams());
    setInternalTeams(StorageService.getInternalTeams());
    setProductionLogs(StorageService.getProductionLogs());
    setFactoryStages(StorageService.getFactoryStages());
    setUsers(StorageService.getUsers());
    setStructureTypes(StorageService.getStructureTypes());
    setSettings(StorageService.getSettings());
  }, []);

  // Sync Dark Mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveDarkMode(darkMode);
  }, [darkMode]);

  // Handle Role change & auto tab safety (Apenas Admin tem permissão)
  const handleRoleChange = (role: UserRole) => {
    if (currentUser?.role !== 'admin') return;
    setActiveRole(role);
    StorageService.saveActiveRole(role);
    const targetRoleConfig = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.admin;
    if (!targetRoleConfig.allowedTabs.includes(activeTab)) {
      setActiveTab(targetRoleConfig.allowedTabs[0]);
    }
  };

  // Google SSO Authentication Handler
  const handleGoogleLogin = (user: SystemUser) => {
    setCurrentUser(user);
    StorageService.saveCurrentUser(user);
    setActiveRole(user.role);
    StorageService.saveActiveRole(user.role);

    // Auto-select linked seller for Vendedor role
    if (user.linkedSellerId) {
      setSelectedSellerId(user.linkedSellerId);
    } else if (user.role === 'vendedor') {
      const matchedSeller = sellers.find(s => 
        s.email?.toLowerCase() === user.email.toLowerCase() || 
        s.name.toLowerCase() === user.name.toLowerCase()
      );
      if (matchedSeller) {
        setSelectedSellerId(matchedSeller.id);
      }
    }

    const targetRoleConfig = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.admin;
    if (!targetRoleConfig.allowedTabs.includes(activeTab)) {
      setActiveTab(targetRoleConfig.allowedTabs[0]);
    }
  };

  // Google SSO Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    StorageService.saveCurrentUser(null);
  };

  // Status counts for Sidebar badges
  const statusCounts = {
    totalObras: projects.length,
    entrada: projects.filter(p => p.status === 'entrada').length,
    producao: projects.filter(p => p.status === 'producao').length,
    acabamento: projects.filter(p => p.status === 'acabamento').length,
    aguardando_entrega: projects.filter(p => p.status === 'aguardando_entrega').length,
    instalacao: projects.filter(p => p.status === 'instalacao').length,
    finalizada: projects.filter(p => p.status === 'finalizada').length,
  };

  // Permissions based on Role Config
  const roleConfig = ROLE_DEFINITIONS[activeRole] || ROLE_DEFINITIONS.admin;
  const canCreateWork = roleConfig.canCreateWork;
  const canEditWork = roleConfig.canEditWork;
  const canDeleteWork = roleConfig.canDeleteWork;
  const canEditFinancial = roleConfig.canEditFinancial;
  const canManageClients = activeRole === 'admin' || activeRole === 'supervisor' || activeRole === 'projetos' || activeRole === 'orcamentista';
  const canManageSuppliers = activeRole === 'admin' || activeRole === 'supervisor' || activeRole === 'projetos';
  const canManageSellers = activeRole === 'admin' || activeRole === 'supervisor' || activeRole === 'projetos';
  const canManageTeams = activeRole === 'admin' || activeRole === 'supervisor' || activeRole === 'projetos';
  const canManageSettings = roleConfig.canManageSettings;
  const canManageUsers = roleConfig.canManageUsers;

  // Work Operations
  const handleSaveWork = (updatedWork: WorkProject) => {
    const isNew = !projects.some(p => p.id === updatedWork.id);
    let newProjectsList: WorkProject[];
    if (isNew) {
      newProjectsList = [updatedWork, ...projects];
    } else {
      newProjectsList = projects.map(p => p.id === updatedWork.id ? updatedWork : p);
    }
    setProjects(newProjectsList);
    StorageService.saveProjects(newProjectsList);

    if (selectedProjectForDetail?.id === updatedWork.id) {
      setSelectedProjectForDetail(updatedWork);
    }
  };

  const handleUpdateStatus = (workId: string, newStatus: WorkStatus) => {
    const updated = projects.map(p => {
      if (p.id === workId) {
        const newProgress = calculateProgressForStatus(newStatus, factoryStages);
        return {
          ...p,
          status: newStatus,
          progressPercent: newProgress,
          completionDate: newStatus === 'finalizada' ? new Date().toISOString().split('T')[0] : p.completionDate,
        };
      }
      return p;
    });
    setProjects(updated);
    StorageService.saveProjects(updated);
  };

  const handleDeleteWork = (workId: string) => {
    const updated = projects.filter(p => p.id !== workId);
    setProjects(updated);
    StorageService.saveProjects(updated);
    setSelectedProjectForDetail(null);
  };

  const handleToggleArchiveWork = (workId: string) => {
    const updated = projects.map(p => {
      if (p.id === workId) {
        const isArchived = !p.isArchived;
        return {
          ...p,
          isArchived,
          archivedAt: isArchived ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return p;
    });
    setProjects(updated);
    StorageService.saveProjects(updated);
    if (selectedProjectForDetail?.id === workId) {
      const updatedProj = updated.find(p => p.id === workId);
      if (updatedProj) setSelectedProjectForDetail(updatedProj);
    }
  };

  // Financial Operations
  const handleSaveTransaction = (transaction: FinancialTransaction) => {
    const updated = [transaction, ...transactions];
    setTransactions(updated);
    StorageService.saveTransactions(updated);
  };

  const handleToggleTransactionStatus = (transactionId: string) => {
    const updated = transactions.map(t => {
      if (t.id === transactionId) {
        const isPaid = t.status === 'pago';
        return {
          ...t,
          status: isPaid ? 'pendente' as const : 'pago' as const,
          paymentDate: isPaid ? undefined : new Date().toISOString().split('T')[0],
        };
      }
      return t;
    });
    setTransactions(updated);
    StorageService.saveTransactions(updated);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const updated = transactions.filter(t => t.id !== transactionId);
    setTransactions(updated);
    StorageService.saveTransactions(updated);
  };

  // Clients Operations
  const handleSaveClient = (client: Client) => {
    const exists = clients.some(c => c.id === client.id);
    const updated = exists ? clients.map(c => c.id === client.id ? client : c) : [client, ...clients];
    setClients(updated);
    StorageService.saveClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    const updated = clients.filter(c => c.id !== clientId);
    setClients(updated);
    StorageService.saveClients(updated);
  };

  // Suppliers Operations
  const handleSaveSupplier = (supplier: Supplier) => {
    const exists = suppliers.some(s => s.id === supplier.id);
    const updated = exists ? suppliers.map(s => s.id === supplier.id ? supplier : s) : [supplier, ...suppliers];
    setSuppliers(updated);
    StorageService.saveSuppliers(updated);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const updated = suppliers.filter(s => s.id !== supplierId);
    setSuppliers(updated);
    StorageService.saveSuppliers(updated);
  };

  // Sellers Operations
  const handleSaveSeller = (seller: Seller) => {
    const exists = sellers.some(s => s.id === seller.id);
    const updated = exists ? sellers.map(s => s.id === seller.id ? seller : s) : [seller, ...sellers];
    setSellers(updated);
    StorageService.saveSellers(updated);
  };

  const handleDeleteSeller = (sellerId: string) => {
    const updated = sellers.filter(s => s.id !== sellerId);
    setSellers(updated);
    StorageService.saveSellers(updated);
  };

  // Teams Operations
  const handleSaveTeam = (team: InstallationTeam) => {
    const exists = teams.some(t => t.id === team.id);
    const updated = exists ? teams.map(t => t.id === team.id ? team : t) : [team, ...teams];
    setTeams(updated);
    StorageService.saveTeams(updated);
  };

  const handleDeleteTeam = (teamId: string) => {
    const updated = teams.filter(t => t.id !== teamId);
    setTeams(updated);
    StorageService.saveTeams(updated);
  };

  // Internal Performance & Production Teams Operations
  const handleUpdateFactoryStages = (newStages: FactoryStageConfig[]) => {
    setFactoryStages(newStages);
    StorageService.saveFactoryStages(newStages);
  };

  const handleSaveInternalTeam = (team: InternalProductionTeam) => {
    const exists = internalTeams.some(t => t.id === team.id);
    const updated = exists ? internalTeams.map(t => t.id === team.id ? team : t) : [team, ...internalTeams];
    setInternalTeams(updated);
    StorageService.saveInternalTeams(updated);
  };

  const handleDeleteInternalTeam = (teamId: string) => {
    const updated = internalTeams.filter(t => t.id !== teamId);
    setInternalTeams(updated);
    StorageService.saveInternalTeams(updated);
  };

  const handleSaveProductionLog = (log: ProductionDailyLog) => {
    const exists = productionLogs.some(l => l.id === log.id);
    const updated = exists ? productionLogs.map(l => l.id === log.id ? log : l) : [log, ...productionLogs];
    setProductionLogs(updated);
    StorageService.saveProductionLogs(updated);
  };

  const handleDeleteProductionLog = (logId: string) => {
    const updated = productionLogs.filter(l => l.id !== logId);
    setProductionLogs(updated);
    StorageService.saveProductionLogs(updated);
  };

  // Users Operations (EXCLUSIVELY IN SETTINGS)
  const handleSaveUser = (user: SystemUser) => {
    const exists = users.some(u => u.id === user.id);
    const updated = exists ? users.map(u => u.id === user.id ? user : u) : [user, ...users];
    setUsers(updated);
    StorageService.saveUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    StorageService.saveUsers(updated);
  };

  // Structure Types Operations (DYNAMIC STRUCTURE CONFIGURATION)
  const handleSaveStructureType = (type: StructureTypeConfig) => {
    const exists = structureTypes.some(st => st.id === type.id);
    const updated = exists ? structureTypes.map(st => st.id === type.id ? type : st) : [type, ...structureTypes];
    setStructureTypes(updated);
    StorageService.saveStructureTypes(updated);
  };

  const handleDeleteStructureType = (typeId: string) => {
    const updated = structureTypes.filter(st => st.id !== typeId);
    setStructureTypes(updated);
    StorageService.saveStructureTypes(updated);
  };

  // Settings Operations
  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleResetData = () => {
    StorageService.resetAllData();
    setProjects(StorageService.getProjects());
    setTransactions(StorageService.getTransactions());
    setClients(StorageService.getClients());
    setSuppliers(StorageService.getSuppliers());
    setSellers(StorageService.getSellers());
    setTeams(StorageService.getTeams());
    setInternalTeams(StorageService.getInternalTeams());
    setProductionLogs(StorageService.getProductionLogs());
    setFactoryStages(StorageService.getFactoryStages());
    setUsers(StorageService.getUsers());
    setStructureTypes(StorageService.getStructureTypes());
    setSettings(StorageService.getSettings());
  };

  const nextWorkCode = `OBR-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`;

  // Se o usuário não estiver autenticado com Conta Google, renderiza a tela de Login Google Oficial
  if (!currentUser) {
    return (
      <GoogleLoginView
        users={users}
        onLoginSuccess={handleGoogleLogin}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenNewWorkModal={() => setIsWorkFormModalOpen(true)}
        canCreateWork={canCreateWork}
        settings={settings}
        sellers={sellers}
        selectedSellerId={selectedSellerId}
        onSelectSeller={setSelectedSellerId}
        users={users}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filtered strictly by allowedTabs for the active role */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          statusCounts={statusCounts}
          activeRole={activeRole}
          currentUser={currentUser}
        />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-slate-100/70 dark:bg-slate-950/70">
          <div className="max-w-7xl mx-auto pb-12">
            {/* 1. DASHBOARD */}
            {activeTab === 'dashboard' && (
              <DashboardView
                projects={projects}
                transactions={transactions}
                onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
                onOpenNewWorkModal={() => setIsWorkFormModalOpen(true)}
              />
            )}

            {/* 2. CONTROLE DE OBRAS (Módulo Separado: Contratos, PDF Viewer, Produtos Contratados, Entregas e Progresso) */}
            {activeTab === 'obras' && (
              <WorkControlView
                projects={projects}
                clients={clients}
                sellers={sellers}
                teams={teams}
                onSaveProject={handleSaveWork}
                onDeleteProject={handleDeleteWork}
                onToggleArchiveProject={handleToggleArchiveWork}
                onSelectProjectForDetail={(proj) => setSelectedProjectForDetail(proj)}
                onOpenNewWorkModal={() => setIsWorkFormModalOpen(true)}
                onNavigateToProductionKanban={(projectId) => {
                  setActiveTab('producao');
                  if (projectId) {
                    const targetProj = projects.find(p => p.id === projectId);
                    if (targetProj) {
                      // target project exists
                    }
                  }
                }}
                canEdit={canEditWork}
                canCreate={canCreateWork}
                canDelete={canDeleteWork}
                activeRole={activeRole}
              />
            )}

            {/* 3. FLUXO DE PRODUÇÃO (Módulo Separado: Esteira Kanban de Fábrica e Montagem em Campo) */}
            {activeTab === 'producao' && (
              <ProductionKanbanView
                projects={projects}
                stages={factoryStages}
                teams={teams}
                sellers={sellers}
                selectedSellerId={selectedSellerId}
                onSelectSeller={setSelectedSellerId}
                onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
                onUpdateProjectStatus={handleUpdateStatus}
                onOpenNewWorkModal={() => setIsWorkFormModalOpen(true)}
                canEditProjects={canEditWork}
                canChangeStatus={roleConfig.canMoveKanban}
                canEditWork={canEditWork}
                activeRole={activeRole}
                currentUser={currentUser}
              />
            )}

            {/* 3.1 DESEMPENHO INTERNO & CONTROLE DE PRODUTIVIDADE DAS EQUIPES FABRIS */}
            {activeTab === 'desempenho_interno' && (
              <InternalPerformanceView
                stages={factoryStages}
                internalTeams={internalTeams}
                productionLogs={productionLogs}
                projects={projects}
                onUpdateStages={handleUpdateFactoryStages}
                onSaveInternalTeam={handleSaveInternalTeam}
                onDeleteInternalTeam={handleDeleteInternalTeam}
                onSaveProductionLog={handleSaveProductionLog}
                onDeleteProductionLog={handleDeleteProductionLog}
                onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
              />
            )}

            {/* 4. CLIENTS REGISTRY */}
            {activeTab === 'clientes' && (
              <ClientsView
                clients={clients}
                projects={projects}
                onSaveClient={handleSaveClient}
                onDeleteClient={handleDeleteClient}
                onNewWorkForClient={(client) => {
                  setSelectedClientForNewWork(client);
                  setIsWorkFormModalOpen(true);
                }}
                canManageClients={canManageClients}
              />
            )}

            {/* 6. SUPPLIERS REGISTRY */}
            {activeTab === 'fornecedores' && (
              <SuppliersView
                suppliers={suppliers}
                onSaveSupplier={handleSaveSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                canManageSuppliers={canManageSuppliers}
              />
            )}

            {/* 7. SELLERS REGISTRY */}
            {activeTab === 'vendedores' && (
              <SellersView
                sellers={sellers}
                projects={projects}
                onSaveSeller={handleSaveSeller}
                onDeleteSeller={handleDeleteSeller}
                canManageSellers={canManageSellers}
              />
            )}

            {/* 8. TEAMS REGISTRY */}
            {activeTab === 'equipes' && (
              <TeamsView
                teams={teams}
                projects={projects}
                onSaveTeam={handleSaveTeam}
                onDeleteTeam={handleDeleteTeam}
                canManageTeams={canManageTeams}
              />
            )}

            {/* 9. REPORTS & ANALYTICS */}
            {activeTab === 'relatorios' && (
              <ReportsView
                projects={projects}
                transactions={transactions}
                teams={teams}
                settings={settings}
              />
            )}

            {/* 10. SETTINGS & EXCLUSIVE USER REGISTRATION */}
            {activeTab === 'configuracoes' && (
              <SettingsView
                settings={settings}
                users={users}
                sellers={sellers}
                factoryStages={factoryStages}
                structureTypes={structureTypes}
                projects={projects}
                onSaveSettings={handleSaveSettings}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onSaveFactoryStages={handleUpdateFactoryStages}
                onSaveStructureType={handleSaveStructureType}
                onDeleteStructureType={handleDeleteStructureType}
                onResetData={handleResetData}
                canManageSettings={canManageSettings}
                canManageUsers={canManageUsers}
                activeRole={activeRole}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Work Detail & BOM Modal */}
      <WorkDetailModal
        project={selectedProjectForDetail}
        isOpen={Boolean(selectedProjectForDetail)}
        onClose={() => setSelectedProjectForDetail(null)}
        onSave={handleSaveWork}
        onDelete={handleDeleteWork}
        teams={teams}
        clients={clients}
        sellers={sellers}
        canEdit={canEditWork && activeRole !== 'vendedor'}
      />

      {/* 2. New Work Project Modal */}
      <WorkFormModal
        isOpen={isWorkFormModalOpen}
        onClose={() => {
          setIsWorkFormModalOpen(false);
          setSelectedClientForNewWork(null);
        }}
        onSave={handleSaveWork}
        clients={clients}
        sellers={sellers}
        structureTypes={structureTypes}
        nextWorkCode={nextWorkCode}
        initialClientId={selectedClientForNewWork?.id}
      />

      {/* 3. New Financial Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        projects={projects}
      />
    </div>
  );
}
