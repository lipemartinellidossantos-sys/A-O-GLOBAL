import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Trash2, 
  Edit3, 
  X, 
  DollarSign, 
  Layers,
  CheckCircle2,
  Building
} from 'lucide-react';
import { Seller, WorkProject } from '../types';
import { formatCurrency } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface SellersViewProps {
  sellers: Seller[];
  projects: WorkProject[];
  onSaveSeller: (seller: Seller) => void;
  onDeleteSeller: (sellerId: string) => void;
  canManageSellers: boolean;
}

export const SellersView: React.FC<SellersViewProps> = ({
  sellers,
  projects,
  onSaveSeller,
  onDeleteSeller,
  canManageSellers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [sellerToDelete, setSellerToDelete] = useState<Seller | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  const openCreateModal = () => {
    setEditingSeller(null);
    setName('');
    setEmail('');
    setPhone('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (seller: Seller) => {
    setEditingSeller(seller);
    setName(seller.name);
    setEmail(seller.email);
    setPhone(seller.phone);
    setActive(seller.active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSeller: Seller = {
      id: editingSeller ? editingSeller.id : `sel-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      active,
    };

    onSaveSeller(newSeller);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (sellerToDelete) {
      onDeleteSeller(sellerToDelete.id);
      setSellerToDelete(null);
    }
  };

  const filtered = sellers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Cadastro de Vendedores & Comercial
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Acompanhamento da equipe comercial e obras vinculadas
          </p>
        </div>

        {canManageSellers && (
          <button
            id="btn-new-seller"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Vendedor</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por vendedor, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/30 outline-hidden"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((seller) => {
          const sellerProjects = projects.filter(p => p.sellerId === seller.id);
          const totalSold = sellerProjects.reduce((acc, p) => acc + (p.contractedValue || 0), 0);

          return (
            <div
              key={seller.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-orange-300 dark:hover:border-orange-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-orange-600" />
                    {sellerProjects.length} obra(s)
                  </span>
                  <span className={`text-[10px] font-bold ${seller.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {seller.active ? '● Ativo' : '○ Inativo'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {seller.name}
                </h3>

                <div className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{seller.phone || 'Telefone não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{seller.email || 'E-mail não informado'}</span>
                  </div>
                </div>

                {/* Sales Volume Summary */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                      Faturamento Total em Obras:
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(totalSold)}
                    </span>
                  </div>
                </div>
              </div>

              {canManageSellers && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {sellerProjects.length > 0 ? `${sellerProjects.length} contratos ativos` : 'Sem obras no momento'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(seller)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar vendedor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSellerToDelete(seller)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Excluir vendedor"
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

      {/* Modal Create/Edit Seller */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingSeller ? 'Editar Vendedor' : 'Novo Cadastro de Vendedor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Roberto Silveira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="vendas@empresa.ind.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded-md text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Vendedor Ativo no Sistema
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{editingSeller ? 'Salvar Alterações' : 'Cadastrar Vendedor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!sellerToDelete}
        title={`Excluir Vendedor "${sellerToDelete?.name}"?`}
        message="Deseja realmente excluir este vendedor do sistema? As obras vinculadas a ele serão preservadas."
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onClose={() => setSellerToDelete(null)}
      />
    </div>
  );
};
