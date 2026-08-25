export type WorkStatus = 
  | 'nao_iniciada'        // Não Iniciada / Aguardando OS
  | 'entrada'             // Entrada / OS Criada
  | 'producao'            // Corte, Solda & Fabricação
  | 'acabamento'          // Pintura / Acabamento / Galvanização
  | 'aguardando_entrega'  // Aguardando Entrega / Transporte
  | 'instalacao'          // Em Instalação / Montagem em Campo
  | 'finalizada';         // Entregue & Finalizada

export type WorkCategory = 
  | 'Galpão Metálico'
  | 'Mezanino Estrutural'
  | 'Portão Industrial'
  | 'Guarda-Corpo & Corrimão'
  | 'Cobertura Metálica'
  | 'Escada Metálica'
  | 'Esquadrias de Aço'
  | 'Estrutura Especial'
  | string;

export interface StructureTypeConfig {
  id: string;
  name: string;
  description?: string;
  defaultUnit?: 'm²' | 'un' | 'm' | 'barras' | 'chapas' | 'conjuntos' | 'peças' | 'm linear' | string;
  suggestedSteelKgPerUnit?: number;
  avgKgPerM2?: number;
  complexity?: 'baixa' | 'media' | 'alta' | 'especial';
  colorTag?: string;
  active: boolean;
  isSystemDefault?: boolean;
}

export type FinancialType = 'receita' | 'despesa';

export type FinancialCategory = 
  | 'Recebimento de Obra'
  | 'Compra de Aço / Perfis'
  | 'Insumos de Solda / Consumíveis'
  | 'Tintas, Primer & Acabamento'
  | 'Parafusos & Fixações'
  | 'Diárias / Montagem em Campo'
  | 'Frete & Logística'
  | 'Maquinário & Manutenção'
  | 'Comissão Comercial'
  | 'Despesa Operacional'
  | 'Outros';

export type UserRole = 
  | 'admin'          // Administrador: Acesso Total ao Sistema (inclusive cadastro de usuários)
  | 'supervisor'     // Supervisor: Acesso Total menos ao Módulo de Configurações
  | 'projetos'       // Projetos: Acesso Total ao Sistema menos ao submenu de Cadastro de Usuários
  | 'orcamentista'   // Orçamentista: Acesso somente Cadastro de Clientes e Controle de Obra, e apenas visualização do Fluxo de Produção
  | 'vendedor'       // Vendedor: Seleciona o vendedor cadastrado para filtrar e somente visualizar o Fluxo de Produção e suas Obras
  | 'gerente_pcp'    // Compatibilidade legada
  | 'financeiro'     // Compatibilidade legada
  | 'lider_montagem'; // Compatibilidade legada

export interface MaterialUsageItem {
  id: string;
  name: string;
  category: 'Aço/Vigas/Tubos' | 'Chapas' | 'Solda' | 'Pintura' | 'Acessórios/Fixação' | 'Outros';
  quantity: number;
  unit: 'kg' | 'ton' | 'barras' | 'chapas' | 'un' | 'latas' | 'rolos';
  unitCost: number;
  totalCost: number;
  supplierId?: string;
  supplierName?: string;
}

export interface QualityChecklistItem {
  id: string;
  title: string;
  checked: boolean;
  checkedBy?: string;
  date?: string;
}

export interface ContractAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  uploadedAt: string;
  fileDataUrl?: string; // base64 / data URL / blob URL para visualização e download
  fileType?: string;
  documentTitle?: string;
}

export interface ProductionOrderItem {
  id: string;
  osNumber: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  clientName: string;
  productId: string;
  productDescription: string;
  structureType?: string;
  quantity: number; // Quantidade programada nesta OS/Lote
  unit: string;
  quantityProduced?: number; // Quantidade já fabricada desta OS
  weightKgEstimated?: number;
  issuedAt: string;
  deadlineDate?: string;
  status: WorkStatus; // 'nao_iniciada', 'entrada', 'producao', etc.
  initialStage?: string;
  priority?: 'baixa' | 'media' | 'alta' | 'urgente';
  paintColor?: string;
  assignedTeam?: string;
  notes?: string;
  isCompleted?: boolean;
  completedAt?: string;
  pdfAttachment?: ContractAttachment; // PDF da ordem que desceu para fábrica / desenho da produção
}

export interface ContractedProductItem {
  id: string;
  description: string;
  structureType?: string; // Tipo de Estrutura do item (Galpão Metálico, Mezanino Estrutural, etc.)
  quantityTotal: number;
  quantityDelivered: number;
  quantityInProduction?: number; // Quantidade total já liberada/gerada em Ordens de Produção
  quantityRemainingToProduce?: number; // Saldo pendente: quantityTotal - quantityInProduction
  unit: 'm²' | 'kg' | 'ton' | 'un' | 'm' | 'barras' | 'chapas' | 'conjuntos' | 'peças' | 'm linear';
  unitPrice: number;
  totalPrice: number;
  status: 'pendente' | 'em_entrega' | 'entregue';
  deliveredAt?: string;
  notes?: string;

  // Vínculo com Ordem para Fluxo de Produção
  osNumber?: string; // Número da OS vinculada a este produto (Ex: OS-OBR-2026-001-01)
  productionStatus?: WorkStatus; // Status do produto no fluxo fabril ('nao_iniciada', 'entrada', 'producao', etc.)
  productionOrderGenerated?: boolean; // Se a ordem de produção já foi gerada
  productionOrderGeneratedAt?: string; // Data em que a ordem foi gerada
  productionOrders?: ProductionOrderItem[]; // Histórico de todas as Ordens de Produção emitidas para este produto
  drawingCode?: string; // Código do Desenho / Projeto Executivo
  steelGrade?: string; // Tipo de Aço (Ex: ASTM A36, SAC 350, A572)
  weightKgEstimated?: number; // Peso em Kg estimado do produto
  pdfAttachment?: ContractAttachment; // Desenho técnico / PDF de fabricação
}

export interface WorkProject {
  id: string;
  code: string; // Ex: OBR-2026-001
  title: string;
  clientId: string;
  clientName: string;
  sellerId: string;
  sellerName: string;
  teamId?: string;
  teamName?: string;
  category: WorkCategory;
  status: WorkStatus;
  steelWeightKg: number;
  contractedValue: number;
  estimatedCost?: number;
  actualCost: number;
  startDate: string;
  businessDays?: number; // Prazo em Dias Úteis
  deadlineDate: string; // Prazo de Entrega Estimado
  completionDate?: string;
  progressPercent: number;
  address: string;
  description: string;
  notes?: string;
  materials?: MaterialUsageItem[];
  checklist: QualityChecklistItem[];
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  createdAt: string;
  contractFiles?: ContractAttachment[];
  contractedProducts?: ContractedProductItem[];
  
  // Novos campos integrados de OS e Obra
  orderCode?: string; // Código do Pedido (Ex: PED-2026-890)
  osNumber?: string; // Número da OS (texto longo)
  osCreatedAt?: string; // Data de emissão da OS
  color?: string; // Cor (Ex: Preto Fosco, Primer Cinza, etc.)
  footage?: string; // Metragem (Ex: 850 m², 120m lineares)
  assemblerName?: string; // Montador
  productionOrderGenerated?: boolean; // Se a ordem para o fluxo de produção foi gerada
  productionOrderGeneratedAt?: string; // Data de geração da ordem de produção
  productionOrderNotes?: string;
  productionOrders?: ProductionOrderItem[]; // Lista de todas as Ordens de Produção geradas para esta obra
  isArchived?: boolean; // Se a obra foi arquivada
  archivedAt?: string; // Data do arquivamento
}

export interface Client {
  id: string;
  name: string;
  tradeName?: string;
  document: string; // CPF ou CNPJ
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  segment?: 'Construção Civil' | 'Indústria' | 'Comércio' | 'Residencial' | 'Agronegócio' | string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  document: string;
  category: 'Aço e Perfis' | 'Tintas e Químicos' | 'Acessórios e Fixação' | 'Gases e Solda' | 'Ferramentas' | 'Outros';
  phone: string;
  email: string;
  city: string;
  state: string;
  paymentTerms: string;
  deliveryAvgDays: number;
  rating: number; // 1 a 5
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  commissionRate?: number;
  monthlyTarget?: number;
  active: boolean;
}

export interface FactoryStageConfig {
  id: string;
  name: string;
  description: string;
  workersCount: number; // quantidade de operários alocados nesta etapa
  order: number;
  color?: string;
  dotColor?: string;
  headerBg?: string;
  statusMapping?: WorkStatus;
  dailyCapacityKgPerWorker?: number;
  dailyCapacityPiecesPerWorker?: number;
  active?: boolean;
}

export interface ProductionTeamMember {
  id: string;
  name: string;
  role: string; // Ex: Soldador MIG, Caldeireiro Líder, Operador de Guilhotina, Pintor Industrial, Ajudante Geral
  phone?: string;
  shift?: string;
}

export interface InternalProductionTeam {
  id: string;
  name: string;
  stageId: string; // Vínculo com a etapa do fluxo fabril (ex: stage-2, stage-3...)
  stageName: string; // Ex: Corte & Plasma, Gabaritagem & Solda
  leader: string;
  membersCount: number;
  members?: ProductionTeamMember[];
  shift: '1º Turno (07:00 - 17:00)' | '2º Turno (17:00 - 02:00)' | 'Geral';
  targetDailyKgPerWorker?: number; // Compatibilidade legada
  targetDailyPiecesPerWorker?: number; // Meta diária de peças por operário (ex: 20 peças/op/dia)
  targetMonthlyPieces?: number; // Meta mensal de peças produzidas pela equipe (ex: 1.500 peças/mês)
  status: 'ativa' | 'em_manutencao' | 'remanejada';
  specialties: string[];
  productivityScore: number; // 0 a 100%
  monthlyProductionKg?: number; // Volume produzido acumulado em kg
  monthlyProductionPieces: number; // Quantidade de peças produzidas acumuladas no mês
  currentAssignedWorkIds?: string[]; // Obras alocadas na bancada desta equipe
}

export interface ProductionDailyLog {
  id: string;
  date: string;
  teamId: string;
  teamName: string;
  stageName: string;
  workProjectId: string;
  workCode: string;
  osNumber?: string;
  clientName: string;
  piecesProduced: number; // Quantidade de peças produzidas no apontamento
  steelWeightKgProduced?: number; // Peso opcional complementar
  footageProduced?: string;
  hoursWorked: number;
  workersCount: number;
  notes?: string;
  qualityStatus: 'aprovado' | 'retrabalho' | 'inspecao_pendente';
  createdAt: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
  linkedSellerId?: string;
  // Campos para Integração em Nuvem e Conta Google
  authProvider?: 'google' | 'local' | 'email';
  googleAccount?: {
    email: string;
    name: string;
    picture?: string;
    verified: boolean;
    hd?: string; // Hosted domain (ex: suaempresa.com.br)
  };
  customPermissions?: {
    canCreateProjects?: boolean;
    canAdvanceKanban?: boolean;
    canViewFinancial?: boolean;
    canEditFinancial?: boolean;
    canManageClients?: boolean;
    canManageSuppliers?: boolean;
    canManageTeams?: boolean;
    canManageSettings?: boolean;
    canExportReports?: boolean;
  };
}

export interface InstallationTeam {
  id: string;
  name: string;
  leader: string;
  membersCount: number;
  phone: string;
  specialities: string[];
  status: 'disponivel' | 'em_campo' | 'em_manutencao';
  productivityScore: number; // 0 a 100
}

export interface FinancialTransaction {
  id: string;
  workProjectId?: string;
  workCode?: string;
  description: string;
  type: FinancialType;
  category: FinancialCategory;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  entityName?: string; // Cliente, Fornecedor ou Prestador
  recipientOrPayer?: string;
  invoiceNumber?: string;
  entityType?: 'cliente' | 'fornecedor' | 'equipe' | 'vendedor' | 'outro';
  documentNumber?: string;
  paymentMethod: 'Boleto' | 'Pix' | 'PIX' | 'Transferência' | 'Cartão' | 'Dinheiro' | 'Cheque';
  notes?: string;
  createdAt: string;
}

export interface SystemSettings {
  companyName: string;
  tradeName: string;
  document: string; // CNPJ
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  defaultSteelPriceKg: number;
  defaultBdiMargin: number;
  laborHourCost: number;
  logoUrl?: string;
}

export interface RolePermission {
  role: UserRole;
  label?: string;
  description?: string;
  permissions?: Record<string, boolean>;
  canCreateProjects?: boolean;
  canAdvanceKanban?: boolean;
  canViewFinancial?: boolean;
  canEditFinancial?: boolean;
  canManageClientsSuppliers?: boolean;
  canManageSellersTeams?: boolean;
  canViewReports?: boolean;
  canManageSettings?: boolean;
}
