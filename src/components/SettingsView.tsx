import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  DollarSign, 
  Save, 
  RotateCcw, 
  Check, 
  Download, 
  Upload, 
  AlertTriangle,
  Boxes,
  Kanban,
  Cloud,
  Users
} from 'lucide-react';
import { 
  SystemSettings, 
  UserRole, 
  SystemUser, 
  StructureTypeConfig, 
  WorkProject,
  FactoryStageConfig,
  Seller
} from '../types';
import { StorageService } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';
import { StructureTypesSettings } from './StructureTypesSettings';
import { FactoryStagesSettings } from './FactoryStagesSettings';
import { CloudDatabaseMigrationSettings } from './CloudDatabaseMigrationSettings';
import { UsersManagementSettings } from './UsersManagementSettings';

interface SettingsViewProps {
  settings: SystemSettings;
  users?: SystemUser[];
  sellers?: Seller[];
  factoryStages?: FactoryStageConfig[];
  structureTypes?: StructureTypeConfig[];
  projects?: WorkProject[];
  onSaveSettings: (newSettings: SystemSettings) => void;
  onSaveUser?: (user: SystemUser) => void;
  onDeleteUser?: (userId: string) => void;
  onSaveFactoryStages?: (stages: FactoryStageConfig[]) => void;
  onSaveStructureType?: (type: StructureTypeConfig) => void;
  onDeleteStructureType?: (typeId: string) => void;
  onResetData: () => void;
  canManageSettings: boolean;
  canManageUsers?: boolean;
  activeRole?: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users = [],
  sellers = [],
  factoryStages = [],
  structureTypes = [],
  projects = [],
  onSaveSettings,
  onSaveUser = () => {},
  onDeleteUser = () => {},
  onSaveFactoryStages = () => {},
  onSaveStructureType = () => {},
  onDeleteStructureType = () => {},
  onResetData,
  canManageSettings,
  canManageUsers = false,
  activeRole = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<
    'usuarios' | 'etapas_fabrica' | 'tipos_estruturas' | 'nuvem_banco' | 'empresa_parametros' | 'dados'
  >(canManageUsers ? 'usuarios' : 'etapas_fabrica');

  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleChange = (field: keyof SystemSettings, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-600" />
            Configurações do Sistema
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Configure {canManageUsers ? 'usuários e permissões, ' : ''}fluxo de produção, parâmetros da empresa e arquitetura de banco de dados
          </p>
        </div>

        {activeTab === 'empresa_parametros' && canManageSettings && (
          <button
            id="btn-save-settings-top"
            onClick={handleSubmitSettings}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Parâmetros</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {/* SUBMENU DE CADASTRO DE USUÁRIOS: Apenas exibido se canManageUsers for true (exclusivo para Administrador) */}
        {canManageUsers && (
          <button
            id="tab-btn-users-management"
            type="button"
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'usuarios'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cadastro de Usuários ({users.length})</span>
          </button>
        )}

        <button
          id="tab-btn-factory-stages"
          type="button"
          onClick={() => setActiveTab('etapas_fabrica')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'etapas_fabrica'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Kanban className="w-4 h-4" />
          <span>Etapas do Fluxo Fabril & Kanban ({factoryStages.length || 7})</span>
        </button>

        <button
          id="tab-btn-cloud-db"
          type="button"
          onClick={() => setActiveTab('nuvem_banco')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'nuvem_banco'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Nuvem & Banco de Dados</span>
        </button>

        <button
          id="tab-btn-structure-types"
          type="button"
          onClick={() => setActiveTab('tipos_estruturas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'tipos_estruturas'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Tipos de Estrutura ({structureTypes.length})</span>
        </button>

        <button
          id="tab-btn-company"
          type="button"
          onClick={() => setActiveTab('empresa_parametros')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'empresa_parametros'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados da Empresa & BDI</span>
        </button>

        <button
          id="tab-btn-data"
          type="button"
          onClick={() => setActiveTab('dados')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'dados'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Backup & Restauração</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 0. ABA DE CADASTRO DE USUÁRIOS (EXCLUSIVA PARA ADMINISTRADOR) */}
      {/* ========================================================================= */}
      {activeTab === 'usuarios' && canManageUsers && (
        <UsersManagementSettings
          users={users}
          sellers={sellers}
          onSaveUser={onSaveUser}
          onDeleteUser={onDeleteUser}
          canManageUsers={canManageUsers}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. ABA DE ETAPAS DA FÁBRICA & KANBAN DINÂMICO */}
      {/* ========================================================================= */}
      {activeTab === 'etapas_fabrica' && (
        <FactoryStagesSettings
          stages={factoryStages}
          onSaveStages={onSaveFactoryStages}
          canManageSettings={canManageSettings}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. ABA DE NUVEM & BANCO DE DADOS */}
      {/* ========================================================================= */}
      {activeTab === 'nuvem_banco' && (
        <CloudDatabaseMigrationSettings
          projects={projects}
          users={users}
          settings={settings}
          canManageSettings={canManageSettings}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. ABA DE TIPOS E CATEGORIAS DE ESTRUTURAS METÁLICAS */}
      {/* ========================================================================= */}
      {activeTab === 'tipos_estruturas' && (
        <StructureTypesSettings
          structureTypes={structureTypes}
          onSaveStructureType={onSaveStructureType}
          onDeleteStructureType={onDeleteStructureType}
          canManageSettings={canManageSettings}
          projects={projects}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. ABA DE DADOS DA EMPRESA & PARÂMETROS */}
      {/* ========================================================================= */}
      {activeTab === 'empresa_parametros' && (
        <form onSubmit={handleSubmitSettings} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-orange-600" />
              Identificação da Empresa & Razão Social
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => handleChange('tradeName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Razão Social Completa
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => handleChange('document', e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Telefone Comercial / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  E-mail de Contato Comercial
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Cidade / UF
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Cidade"
                    className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="UF"
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Endereço da Fábrica / Galpão
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua, Número, Bairro, CEP"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Margem e BDI */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Parâmetros Financeiros, BDI & Custos Padrão
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Preço Base do Aço (R$/kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultSteelPriceKg}
                  onChange={(e) => handleChange('defaultSteelPriceKg', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  BDI Padrão (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.defaultBdiMargin}
                  onChange={(e) => handleChange('defaultBdiMargin', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Custo Hora de Mão de Obra (R$/h)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.laborHourCost}
                  onChange={(e) => handleChange('laborHourCost', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="btn-save-settings-bottom"
              type="submit"
              disabled={!canManageSettings}
              className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Todos os Parâmetros</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 5. ABA DE DADOS, BACKUP & RESTAURAÇÃO */}
      {/* ========================================================================= */}
      {activeTab === 'dados' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-orange-600" />
              Backup Completo dos Dados (JSON)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Exporte todos os cadastros de obras, clientes, vendas, despesas, equipes e etapas para um arquivo de segurança no seu computador.
            </p>

            <button
              id="btn-export-backup-json"
              type="button"
              onClick={() => StorageService.exportBackup()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo de Backup Completo (.JSON)</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              Restaurar Backup a partir de Arquivo
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Selecione um arquivo de backup previamente exportado para restaurar todos os cadastros no sistema.
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Selecionar Arquivo de Backup</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      if (content && StorageService.importBackup(content)) {
                        alert('Dados restaurados com sucesso! A página será atualizada.');
                        window.location.reload();
                      } else {
                        alert('Falha ao restaurar dados. Arquivo inválido.');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>

          {/* Reset All Data Section */}
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-black text-rose-900 dark:text-rose-300 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Zona de Perigo: Redefinir Dados de Fábrica
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 mb-4">
              Substitui todas as obras, clientes e movimentações pelos dados demonstrativos padrão do sistema.
            </p>

            <button
              id="btn-trigger-reset-modal"
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Base de Dados Inicial</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM RESET DATA */}
      {isResetConfirmOpen && (
        <ConfirmModal
          isOpen={isResetConfirmOpen}
          title="Restaurar Banco de Dados Padrão"
          message="Esta ação substituirá todos os dados do sistema pelas obras, clientes e equipes de exemplo padrão. Tem certeza?"
          confirmLabel="Sim, Restaurar Dados Padrão"
          cancelLabel="Cancelar"
          onConfirm={() => {
            onResetData();
            setIsResetConfirmOpen(false);
          }}
          onCancel={() => setIsResetConfirmOpen(false)}
          isDanger
        />
      )}
    </div>
  );
};
