import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Maximize2, 
  Users, 
  Sparkles, 
  X, 
  Smartphone, 
  Monitor,
  Lock,
  Globe,
  AlertCircle,
  Info
} from 'lucide-react';
import { getPublicShareUrl, getDevContainerUrl } from '../utils/shareUtils';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  appName = 'AÇO GESTÃO PRO',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // The public URL that works for all users (e.g. ais-pre-...)
  const publicShareUrl = getPublicShareUrl();
  const devUrl = getDevContainerUrl();
  const isDevEnvironment = devUrl.includes('ais-dev-');

  const handleCopy = async (urlToCopy: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        const input = document.createElement('input');
        input.value = urlToCopy;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar link', err);
    }
  };

  const handleOpenFullscreen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                Acesso Público & Tela Cheia
              </span>
              <h2 className="text-xl font-black tracking-tight mt-0.5">
                Compartilhar Sistema com a Equipe
              </h2>
            </div>
          </div>
          <p className="text-xs text-orange-100 font-medium">
            Link público para qualquer colaborador ou cliente acessar em tela cheia sem código-fonte.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {/* Security & Public Access Notification */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-emerald-700 dark:text-emerald-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-xs">
                Link de Acesso Externo Liberado (Sem Código-Fonte)
              </span>
              <p className="text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed text-[11px]">
                Este link abaixo (com prefixo <strong>ais-pre</strong>) é o endereço público oficial. Ele abre diretamente o <strong>{appName}</strong> para outros usuários sem pedir login de desenvolvedor e sem mostrar o código-fonte.
              </p>
            </div>
          </div>

          {/* Share URL Input & Copy Action */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-orange-600" />
                Link Público para Compartilhar (Para Outros Usuários)
              </label>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md">
                Recomendado
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="input-share-app-url"
                  type="text"
                  readOnly
                  value={publicShareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border-2 border-orange-500/40 dark:border-orange-500/30 rounded-xl text-slate-900 dark:text-white select-all focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                id="btn-copy-share-url"
                type="button"
                onClick={() => handleCopy(publicShareUrl)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white shadow-orange-600/30'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
            
            {copied && (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Link público copiado! Cole no WhatsApp, e-mail ou envie diretamente para os usuários.
              </p>
            )}
          </div>

          {/* Quick Action: Open in Fullscreen Tab */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              id="btn-open-fullscreen-tab"
              type="button"
              onClick={() => handleOpenFullscreen(publicShareUrl)}
              className="flex-1 py-2.5 px-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-950 dark:text-orange-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-orange-200 dark:border-orange-800 transition-all cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-4 h-4 text-orange-600" />
              <span>Testar Abertura em Nova Aba</span>
            </button>
          </div>

          {/* Por que o link anterior não abria? Explanation box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Entenda os tipos de link no Google AI Studio:</span>
            </div>
            <ul className="text-[11px] space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-900 dark:text-white">Link Público (ais-pre-...):</strong> O link gerado acima é o endereço público de visualização. Qualquer pessoa consegue abrir direto no navegador.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Link Privado de Edição (ais-dev-...):</strong> Esse link é exclusivo da sua sessão de programação no editor e não abre para outros usuários.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Botão Share no topo do AI Studio:</strong> Você também pode clicar no botão <em>Share</em> no canto superior direito do Google AI Studio para publicar ou atualizar o link compartilhado.
              </li>
            </ul>
          </div>

          {/* Guidelines for Teams */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-orange-600" />
              Dispositivos Compatíveis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-0.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" />
                  Computador / Escritório
                </div>
                <p>Google Chrome, Microsoft Edge, Safari ou Firefox.</p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-0.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Celular / Fábrica e Obra
                </div>
                <p>Navegador do Android ou iOS (layout adaptativo mobile).</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

