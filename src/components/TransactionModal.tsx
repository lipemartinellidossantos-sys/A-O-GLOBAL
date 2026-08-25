import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Building, 
  FileText, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  FinancialTransaction, 
  WorkProject 
} from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (transaction: FinancialTransaction) => void;
  projects: WorkProject[];
  defaultProject?: WorkProject | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projects = [],
  defaultProject,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const [description, setDescription] = useState(
    defaultProject ? `Entrada / Parcela - Obra ${defaultProject.code}` : 'Recebimento de Obra'
  );
  const [amount, setAmount] = useState<number>(defaultProject ? Math.round(defaultProject.contractedValue * 0.4) : 50000);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [paymentMethod, setPaymentMethod] = useState<FinancialTransaction['paymentMethod']>('Pix');
  const [recipientOrPayer, setRecipientOrPayer] = useState(defaultProject?.clientName || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProject?.id || '');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const matchedProject = projects.find(p => p.id === selectedProjectId);

    const newTransaction: FinancialTransaction = {
      id: `tr-${Date.now()}`,
      workProjectId: selectedProjectId || undefined,
      workCode: matchedProject ? matchedProject.code : undefined,
      type: 'receita',
      category: 'Recebimento de Obra',
      description: description.trim(),
      amount: Number(amount),
      dueDate,
      paymentDate: status === 'pago' ? dueDate : undefined,
      status,
      paymentMethod,
      recipientOrPayer: recipientOrPayer.trim() || (matchedProject ? matchedProject.clientName : 'Cliente'),
      invoiceNumber: invoiceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSave(newTransaction);
    handleClose();
  };

  const handleSelectProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const p = projects.find(proj => proj.id === projectId);
    if (p) {
      if (!recipientOrPayer || recipientOrPayer === 'Cliente') {
        setRecipientOrPayer(p.clientName);
      }
      if (description === 'Recebimento de Obra' || description.startsWith('Entrada / Parcela')) {
        setDescription(`Recebimento / Parcela - Obra ${p.code}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md bg-emerald-600 shadow-emerald-600/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Registrar Recebimento de Obra
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Lançamento de faturamento e parcelas recebidas
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Project Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Obra Vinculada *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProjectChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
            >
              <option value="">-- Selecione uma Obra Cadastrada --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.title} ({p.clientName})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descrição do Recebimento / Parcela *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Entrada 40% - Início de Fabricação"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valor Recebido (R$) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data do Recebimento / Vencimento *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              >
                <option value="Pix">PIX / Transferência Instantânea</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Transferência">TED / DOC Bancário</option>
                <option value="Cartão">Cartão de Crédito / Débito</option>
                <option value="Cheque">Cheque</option>
                <option value="Dinheiro">Dinheiro / Espécie</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status do Recebimento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pago' | 'pendente')}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              >
                <option value="pago">✓ Recebido / Quitado</option>
                <option value="pendente">⏳ Em Aberto / A Receber</option>
              </select>
            </div>
          </div>

          {/* Payer & Invoice Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cliente / Pagador
              </label>
              <input
                type="text"
                placeholder="Nome do cliente"
                value={recipientOrPayer}
                onChange={(e) => setRecipientOrPayer(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nota Fiscal / Documento (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: NF-e 4589"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Dados Bancários
            </label>
            <input
              type="text"
              placeholder="Ex: Comprovante arquivado, conta Santander"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              Salvar Recebimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
