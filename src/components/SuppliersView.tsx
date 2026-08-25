import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Trash2, 
  Edit3, 
  X, 
  Star, 
  Clock, 
  DollarSign, 
  Layers 
} from 'lucide-react';
import { Supplier } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  onSaveSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  canManageSuppliers: boolean;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  onSaveSupplier,
  onDeleteSupplier,
  canManageSuppliers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [category, setCategory] = useState<Supplier['category']>('Aço e Perfis');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [paymentTerms, setPaymentTerms] = useState('28 / 56 d.d.l.');
  const [deliveryAvgDays, setDeliveryAvgDays] = useState<number>(4);
  const [rating, setRating] = useState<number>(5);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setName('');
    setTradeName('');
    setDocument('');
    setCategory('Aço e Perfis');
    setPhone('');
    setEmail('');
    setCity('');
    setState('SP');
    setPaymentTerms('28 / 56 d.d.l.');
    setDeliveryAvgDays(4);
    setRating(5);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setTradeName(supplier.tradeName || '');
    setDocument(supplier.document);
    setCategory(supplier.category);
    setPhone(supplier.phone);
    setEmail(supplier.email);
    setCity(supplier.city);
    setState(supplier.state);
    setPaymentTerms(supplier.paymentTerms);
    setDeliveryAvgDays(supplier.deliveryAvgDays);
    setRating(supplier.rating);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSupplier: Supplier = {
      id: editingSupplier ? editingSupplier.id : `sup-${Date.now()}`,
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      document: document.trim(),
      category,
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim() || 'São Paulo',
      state: state.trim() || 'SP',
      paymentTerms: paymentTerms.trim(),
      deliveryAvgDays: Number(deliveryAvgDays),
      rating: Number(rating),
    };

    onSaveSupplier(newSupplier);
    setIsModalOpen(false);
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.tradeName && s.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-600" />
            Cadastro de Fornecedores de Insumos
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Usinas de aço, distribuidores de perfis e tubos, gases industriais, tintas epóxi e fixadores
          </p>
        </div>

        {canManageSuppliers && (
          <button
            id="btn-new-supplier"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Fornecedor</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por fornecedor, categoria de insumo ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-orange-300 dark:hover:border-orange-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                  {sup.category}
                </span>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < sup.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {sup.name}
              </h3>
              {sup.tradeName && (
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                  {sup.tradeName}
                </p>
              )}

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{sup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{sup.city}/{sup.state}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Prazo de Entrega</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {sup.deliveryAvgDays} dias úteis
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Condição de Pagto</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {sup.paymentTerms}
                  </span>
                </div>
              </div>
            </div>

            {canManageSuppliers && (
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1">
                <button
                  onClick={() => openEditModal(sup)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Editar fornecedor"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Deseja excluir o fornecedor ${sup.name}?`)) {
                      onDeleteSupplier(sup.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Excluir fornecedor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Create/Edit Supplier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Cadastro de Fornecedor'}
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
                  Razão Social / Nome do Fornecedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gerdau Distribuição de Aços S.A."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Gerdau Aços"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria de Insumo
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Aço e Perfis">Aço e Perfis</option>
                    <option value="Tintas e Químicos">Tintas e Químicos</option>
                    <option value="Acessórios e Fixação">Acessórios e Fixação</option>
                    <option value="Gases e Solda">Gases e Solda</option>
                    <option value="Ferramentas">Ferramentas e Abrasivos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 3000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="vendas@fornecedor.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo Médio Entrega (Dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={deliveryAvgDays}
                    onChange={(e) => setDeliveryAvgDays(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Condição de Pagamento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 28 / 56 d.d.l."
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all"
                >
                  <span>{editingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
