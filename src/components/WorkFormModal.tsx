import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  FolderPlus, 
  Calendar, 
  UploadCloud, 
  FileText, 
  Trash2, 
  PackageCheck,
  Building,
  User,
  Clock,
  Sparkles,
  Hash,
  Scale,
  DollarSign,
  Kanban,
  CheckCircle2,
  Layers,
  Paintbrush
} from 'lucide-react';
import { 
  WorkProject, 
  WorkCategory, 
  Client, 
  Seller, 
  ContractAttachment,
  ContractedProductItem,
  StructureTypeConfig
} from '../types';
import { formatCurrency, addBusinessDays, StorageService } from '../services/storage';

interface WorkFormModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (newWork: WorkProject) => void;
  clients: Client[];
  sellers: Seller[];
  structureTypes?: StructureTypeConfig[];
  nextWorkCode: string;
  initialClientId?: string;
}

export const WorkFormModal: React.FC<WorkFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clients = [],
  sellers = [],
  structureTypes,
  nextWorkCode,
  initialClientId,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const availableCategories = (structureTypes && structureTypes.length > 0 
    ? structureTypes 
    : StorageService.getStructureTypes()
  ).filter(st => st.active !== false);

  const defaultStructureType = availableCategories[0]?.name || 'Galpão Metálico';

  const initialClient = clients.find(c => c.id === initialClientId) || clients[0];
  const [title, setTitle] = useState(() => {
    if (initialClient) {
      return initialClient.tradeName || initialClient.name || '';
    }
    return '';
  });
  const initialOrderCode = `PED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const [orderCode, setOrderCode] = useState(initialOrderCode);
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || '');
  const [sellerId, setSellerId] = useState(sellers[0]?.id || '');
  const [contractedValue, setContractedValue] = useState<number | ''>('');
  
  // Date calculation with business days
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [businessDays, setBusinessDays] = useState<number>(30);
  const [deadlineDate, setDeadlineDate] = useState<string>(() => addBusinessDays(new Date().toISOString().split('T')[0], 30));
  
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('baixa');
  const [address, setAddress] = useState(() => {
    if (initialClient && initialClient.address) {
      return `${initialClient.address}${initialClient.city ? `, ${initialClient.city}/${initialClient.state || 'SP'}` : ''}`;
    }
    return '';
  });
  const [description, setDescription] = useState('');

  // Initial Contracted Products (starts empty)
  const [contractedProducts, setContractedProducts] = useState<ContractedProductItem[]>([]);

  // Initial Contract Files & Drag and Drop state
  const [contractFiles, setContractFiles] = useState<ContractAttachment[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update client if initialClientId changes
  useEffect(() => {
    if (initialClientId) {
      setClientId(initialClientId);
      const cl = clients.find(c => c.id === initialClientId);
      if (cl) {
        if (cl.address) {
          setAddress(`${cl.address}${cl.city ? `, ${cl.city}/${cl.state || 'SP'}` : ''}`);
        }
        setTitle(cl.tradeName || cl.name || '');
      }
    }
  }, [initialClientId, clients]);

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    const cl = clients.find(c => c.id === newClientId);
    if (cl) {
      if (cl.address) {
        setAddress(`${cl.address}${cl.city ? `, ${cl.city}/${cl.state || 'SP'}` : ''}`);
      }
      // Auto-preenche o título com o nome fantasia cadastrado
      setTitle(cl.tradeName || cl.name || '');
    }
  };

  // Auto calculate deadlineDate when startDate or businessDays changes
  const handleStartDateChange = (newDate: string) => {
    setStartDate(newDate);
    if (newDate && businessDays > 0) {
      setDeadlineDate(addBusinessDays(newDate, businessDays));
    }
  };

  const handleBusinessDaysChange = (days: number) => {
    setBusinessDays(days);
    if (startDate && days > 0) {
      setDeadlineDate(addBusinessDays(startDate, days));
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newAttachment: ContractAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileDataUrl: dataUrl,
        fileType: file.type || 'application/pdf',
        documentTitle: `Contrato de Obra - ${nextWorkCode}`,
      };

      setContractFiles(prev => [...prev, newAttachment]);
    };

    reader.readAsDataURL(file);
  };

  const handleAddProductItem = () => {
    const nextIdx = contractedProducts.length + 1;
    const newItem: ContractedProductItem = {
      id: `cp-${Date.now()}-${nextIdx}`,
      description: '',
      structureType: defaultStructureType,
      quantityTotal: 1,
      quantityDelivered: 0,
      unit: 'm²',
      unitPrice: 0,
      totalPrice: 0,
      status: 'pendente',
      osNumber: `${orderCode}-${String(nextIdx).padStart(2, '0')}`,
      productionStatus: 'nao_iniciada',
      productionOrderGenerated: true,
    };
    setContractedProducts(prev => [...prev, newItem]);
  };

  const handleUpdateProductItem = (id: string, field: keyof ContractedProductItem, val: any) => {
    setContractedProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: val };
        if (field === 'quantityTotal' || field === 'unitPrice') {
          const qty = Number(updated.quantityTotal) || 0;
          const price = Number(updated.unitPrice) || 0;
          updated.totalPrice = qty * price;
        }
        return updated;
      }
      return p;
    }));
  };

  const handleDeleteProductItem = (id: string) => {
    setContractedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    const selectedClient = clients.find(c => c.id === clientId);
    const selectedSeller = sellers.find(s => s.id === sellerId);

    const calculatedProductsValue = contractedProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const finalContractedVal = calculatedProductsValue > 0 ? calculatedProductsValue : (Number(contractedValue) || 0);

    // Derive category from first product's structureType or default
    const primaryCategory = (contractedProducts[0]?.structureType as WorkCategory) || defaultStructureType;

    // Calculate total steel weight from products or fallback
    const totalSteelWeight = contractedProducts.reduce((sum, p) => {
      if (p.weightKgEstimated) return sum + p.weightKgEstimated;
      const stConfig = availableCategories.find(c => c.name === p.structureType);
      const kgFactor = stConfig?.suggestedSteelKgPerUnit || 35;
      return sum + (Number(p.quantityTotal || 1) * kgFactor);
    }, 0);

    // Mapeia e vincula cada produto à Ordem de Produção
    const mappedProducts: ContractedProductItem[] = contractedProducts.map((prod, index) => {
      const prodOs = prod.osNumber || `${orderCode}-${String(index + 1).padStart(2, '0')}`;
      const stConfig = availableCategories.find(c => c.name === prod.structureType);
      const estWeight = prod.weightKgEstimated || Math.round(Number(prod.quantityTotal || 1) * (stConfig?.suggestedSteelKgPerUnit || 35));

      return {
        ...prod,
        structureType: prod.structureType || defaultStructureType,
        osNumber: prodOs,
        productionStatus: 'nao_iniciada',
        productionOrderGenerated: true,
        productionOrderGeneratedAt: prod.productionOrderGeneratedAt || new Date().toISOString().split('T')[0],
        weightKgEstimated: estWeight,
      };
    });

    const newProject: WorkProject = {
      id: `proj-${Date.now()}`,
      code: nextWorkCode,
      orderCode: orderCode.trim() || undefined,
      title: title.trim(),
      clientId,
      clientName: selectedClient ? selectedClient.name : 'Cliente Avulso',
      sellerId,
      sellerName: selectedSeller ? selectedSeller.name : 'Comercial',
      category: primaryCategory,
      status: 'nao_iniciada', // Inserido direto no fluxo de produção na coluna NÃO INICIADA
      steelWeightKg: Math.round(totalSteelWeight) || 3500,
      contractedValue: finalContractedVal,
      actualCost: 0,
      startDate,
      businessDays: Number(businessDays),
      deadlineDate: deadlineDate || addBusinessDays(startDate, Number(businessDays)),
      progressPercent: 0,
      address: address.trim() || (selectedClient ? `${selectedClient.address}${selectedClient.city ? `, ${selectedClient.city}/${selectedClient.state || 'SP'}` : ''}` : 'Local a definir'),
      description: description.trim() || 'Estrutura metálica sob medida.',
      priority,
      createdAt: new Date().toISOString().split('T')[0],
      contractFiles,
      contractedProducts: mappedProducts,
      
      osNumber: orderCode,
      osCreatedAt: new Date().toISOString().split('T')[0],
      productionOrderGenerated: true,
      productionOrderGeneratedAt: new Date().toISOString().split('T')[0],
      productionOrderNotes: `Obra cadastrada com ${mappedProducts.length} produto(s) no escopo.`,

      checklist: [
        { id: `chk-${Date.now()}-1`, title: 'Cálculo estrutural e emissão de ART', checked: false },
        { id: `chk-${Date.now()}-2`, title: 'Pedido e recebimento de aço e perfis', checked: false },
        { id: `chk-${Date.now()}-3`, title: 'Corte, furação e chanfro no plasma/serra', checked: false },
        { id: `chk-${Date.now()}-4`, title: 'Gabaritagem e solda estrutural', checked: false },
        { id: `chk-${Date.now()}-5`, title: 'Tratamento superficial Sa 2.5 e pintura', checked: false },
        { id: `chk-${Date.now()}-6`, title: 'Expedição e montagem na obra', checked: false },
      ],
      materials: [
        {
          id: `mat-${Date.now()}-1`,
          name: 'Perfis Estruturais e Vigas de Aço',
          category: 'Aço/Vigas/Tubos',
          quantity: Math.round(totalSteelWeight) || 3500,
          unit: 'kg',
          unitCost: 11.50,
          totalCost: (Math.round(totalSteelWeight) || 3500) * 11.50,
          supplierName: 'Gerdau / ArcelorMittal',
        }
      ]
    };

    onSave(newProject);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">
                  Código: {nextWorkCode}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Status: Não Iniciada (0%)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Cadastrar Nova Obra
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Row 1: Title and Order Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Título / Nome da Obra *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Galpão Industrial 1.500m²"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-orange-500" />
                Código do Pedido *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: PED-2026-089"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Row 2: Client & Seller */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Cliente Contratante *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName ? `${c.tradeName} (${c.name})` : c.name} - {c.document}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Vendedor / Comercial Responsável *
              </label>
              <select
                required
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              >
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} (Comissão {s.commissionRate}%)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Priority & Global Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prioridade de Atendimento
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:border-orange-500"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Normal / Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Valor Contratado Estimado (R$)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Ex: 75.000,00"
                value={contractedValue}
                onChange={(e) => setContractedValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-emerald-600 focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          {/* Row 4: Dates & Business Days Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-orange-50/50 dark:bg-orange-950/20 p-3.5 rounded-xl border border-orange-200/70 dark:border-orange-900/40">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                Data de Início *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                Prazo (Dias Úteis) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="365"
                value={businessDays}
                onChange={(e) => handleBusinessDaysChange(Number(e.target.value))}
                placeholder="Ex: 30"
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-orange-600"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Calcula desconsiderando sábados e domingos
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                Prazo de Entrega Estimado *
              </label>
              <input
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-orange-700 dark:text-orange-300"
              />
              <span className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5 block font-medium">
                Auto-calculado: {startDate} + {businessDays} dias úteis
              </span>
            </div>
          </div>

          {/* Address & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Endereço de Entrega / Instalação
              </label>
              <input
                type="text"
                placeholder="Ex: Av. Industrial, 500 - Galpão 3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Observações Técnicas Gerais
              </label>
              <input
                type="text"
                placeholder="Ex: Estrutura em perfil laminado, pintura epóxi cinza."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* PRODUCTS LIST SECTION (WITH TIPO DE ESTRUTURA) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-orange-600" />
                  Produtos e Itens Cadastrados na Obra (Escopo)
                </span>
                <span className="text-[11px] text-slate-500">
                  Informe a descrição e o tipo de estrutura de cada produto ou peça contratada
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddProductItem}
                className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Produto</span>
              </button>
            </div>

            {contractedProducts.length === 0 ? (
              <div className="text-center py-6 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900/60 space-y-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Nenhum produto cadastrado no escopo inicial
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ex: Galpão Metálico 20x40m, Mezanino 150m², Portão Basculante, Tesouras de Aço
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddProductItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Primeiro Produto / Peça
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {contractedProducts.map((item) => (
                  <div 
                    key={item.id}
                    className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs"
                  >
                    {/* Descrição do Produto */}
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">Descrição</label>
                      <input
                        type="text"
                        placeholder="Ex: Tesouras de Aço / Galpão 20x40m"
                        value={item.description}
                        onChange={(e) => handleUpdateProductItem(item.id, 'description', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium text-xs focus:outline-hidden focus:border-orange-500"
                      />
                    </div>

                    {/* Tipo de Estrutura */}
                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">Tipo de Estrutura</label>
                      <select
                        value={item.structureType || defaultStructureType}
                        onChange={(e) => handleUpdateProductItem(item.id, 'structureType', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                        title="Tipo de Estrutura"
                      >
                        {availableCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantidade */}
                    <div className="col-span-4 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">Qtd</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Ex: 1"
                        value={item.quantityTotal === 0 ? '' : item.quantityTotal}
                        onChange={(e) => handleUpdateProductItem(item.id, 'quantityTotal', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-center font-bold text-xs focus:outline-hidden focus:border-orange-500"
                      />
                    </div>

                    {/* Unidade */}
                    <div className="col-span-4 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">Un</label>
                      <select
                        value={item.unit}
                        onChange={(e) => handleUpdateProductItem(item.id, 'unit', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs focus:outline-hidden focus:border-orange-500"
                      >
                        <option value="m²">m²</option>
                        <option value="m linear">m linear</option>
                        <option value="kg">kg</option>
                        <option value="ton">ton</option>
                        <option value="un">un</option>
                        <option value="barras">barras</option>
                        <option value="chapas">chapas</option>
                        <option value="conjuntos">conjuntos</option>
                        <option value="peças">peças</option>
                      </select>
                    </div>

                    {/* Valor Unitário */}
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">Unit (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Ex: 1500,00"
                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                        onChange={(e) => handleUpdateProductItem(item.id, 'unitPrice', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-right text-emerald-600 font-bold text-xs focus:outline-hidden focus:border-orange-500"
                      />
                    </div>

                    {/* Excluir */}
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteProductItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remover produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {contractedProducts.length > 0 && (
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-500">
                  Total de itens: <strong className="text-slate-800 dark:text-slate-200">{contractedProducts.length}</strong>
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Soma dos Itens: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(contractedProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0))}</span>
                </span>
              </div>
            )}
          </div>

          {/* CONTRACT ATTACHMENT SECTION */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-600" />
              Anexar Contrato Assinado / Proposta Comercial (PDF ou Imagem)
            </span>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDraggingFile
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UploadCloud className="w-7 h-7 text-orange-600 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Arraste o arquivo do contrato ou clique para selecionar
              </p>
              <p className="text-[11px] text-slate-500">
                Suporta PDF, JPG, PNG e DOCX
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Attached Files List */}
            {contractFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {contractFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                      <span className="font-semibold truncate text-slate-900 dark:text-white">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({Math.round(file.sizeBytes / 1024)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContractFiles(prev => prev.filter(f => f.id !== file.id))}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors text-xs cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btn-save-new-work"
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all text-xs cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Salvar e Cadastrar Obra</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
