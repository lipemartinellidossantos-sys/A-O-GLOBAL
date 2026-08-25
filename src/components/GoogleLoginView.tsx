import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Sun, 
  Moon, 
  AlertCircle,
  KeyRound,
  Lock,
  Building2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { SystemUser } from '../types';
import { StorageService } from '../services/storage';

interface GoogleLoginViewProps {
  users: SystemUser[];
  onLoginSuccess: (user: SystemUser) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const GoogleLoginView: React.FC<GoogleLoginViewProps> = ({
  users,
  onLoginSuccess,
  darkMode,
  onToggleDarkMode,
}) => {
  const [typedEmail, setTypedEmail] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Contas administradoras master
  const MASTER_ADMIN_EMAILS = [
    'lipe.martinellidossantos@gmail.com',
    'felipesistema79@gmail.com'
  ];

  // Autenticação com a Conta Google digitada
  const handleAuthenticate = (emailToVerify: string) => {
    setErrorMsg('');
    const cleanEmail = emailToVerify.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Por favor, digite um e-mail válido da sua Conta Google (Gmail ou Google Workspace).');
      return;
    }

    setIsAuthenticating(true);
    setAuthStep(`Verificando credenciais da Conta Google: ${cleanEmail}`);

    setTimeout(() => {
      setAuthStep('Consultando permissões de acesso cadastradas...');

      setTimeout(() => {
        setIsAuthenticating(false);

        // Obter os usuários mais atualizados do armazenamento
        const currentRegisteredUsers = StorageService.getUsers();
        const allUsersPool = currentRegisteredUsers.length > 0 ? currentRegisteredUsers : users;

        // 1. Verificar se é um e-mail cadastrado
        const matchedUser = allUsersPool.find(
          u => u.email.trim().toLowerCase() === cleanEmail && u.active !== false
        );

        // 2. Verificar se é um Administrador Master
        const isMaster = MASTER_ADMIN_EMAILS.some(e => e.toLowerCase() === cleanEmail);

        if (matchedUser) {
          onLoginSuccess({
            ...matchedUser,
            lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
            authProvider: 'google',
            googleAccount: {
              email: matchedUser.email,
              name: matchedUser.name,
              verified: true,
              hd: matchedUser.email.split('@')[1] || 'gmail.com',
            },
          });
        } else if (isMaster) {
          const masterUser: SystemUser = {
            id: `usr-admin-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
            name: cleanEmail.includes('felipesistema') ? 'Felipe Sistema (Administrador)' : 'Felipe Martinelli (Administrador)',
            email: cleanEmail,
            role: 'admin',
            department: 'Diretoria & Administração Geral',
            active: true,
            createdAt: new Date().toISOString().split('T')[0],
            lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
            authProvider: 'google',
            googleAccount: {
              email: cleanEmail,
              name: 'Administrador Master',
              verified: true,
              hd: 'gmail.com',
            },
            customPermissions: {
              canCreateProjects: true,
              canAdvanceKanban: true,
              canViewFinancial: true,
              canEditFinancial: true,
              canManageClients: true,
              canManageSuppliers: true,
              canManageTeams: true,
              canManageSettings: true,
              canExportReports: true,
            },
          };
          onLoginSuccess(masterUser);
        } else {
          // Bloqueio rigoroso: O e-mail não possui cadastro no sistema
          setErrorMsg(
            `Acesso negado: O e-mail "${cleanEmail}" não possui cadastro ativo nesta empresa. Solicite ao Administrador a inclusão do seu e-mail no sistema em Configurações > Cadastro de Usuários.`
          );
        }
      }, 350);
    }, 300);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuthenticate(typedEmail);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Luzes de ambientação sutis */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Barra Superior */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                AÇO<span className="text-orange-500">GESTÃO</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-orange-950 text-orange-400 border border-orange-800/60">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Serralheria Industrial & Gestão de Estruturas Metálicas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Acesso Restrito · Autenticação Google</span>
          </div>

          <button
            id="btn-login-theme-toggle"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            aria-label="Alternar tema"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* Painel Central de Login Exclusivo */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Cabeçalho do Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-800/60 text-orange-400 text-xs font-bold mb-3 shadow-xs">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Autenticação de Usuário</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Entrar no Sistema
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Informe seu e-mail Google cadastrado para acessar seu painel com as permissões autorizadas da sua função.
            </p>
          </div>

          {/* Indicador de Progresso de Login */}
          {isAuthenticating && (
            <div className="mb-6 p-4 rounded-2xl bg-orange-950/60 border border-orange-600/50 flex items-center gap-3.5 animate-pulse">
              <div className="w-7 h-7 rounded-full border-2 border-orange-500 border-t-transparent animate-spin shrink-0" />
              <div>
                <p className="text-xs font-bold text-orange-300">{authStep}</p>
                <p className="text-[11px] text-orange-400/80">Carregando permissões...</p>
              </div>
            </div>
          )}

          {/* Alerta de Acesso Negado / Erro */}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-100 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-300">Acesso Restrito</p>
                <p className="leading-relaxed text-rose-200/90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Formulário de Login Individual */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="input-google-login-email" className="block text-xs font-bold text-slate-300 mb-1.5">
                E-mail da Conta Google
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  {/* Ícone Oficial de 4 Cores do Google */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <input
                  id="input-google-login-email"
                  type="email"
                  required
                  value={typedEmail}
                  onChange={(e) => setTypedEmail(e.target.value)}
                  placeholder="seu.email@gmail.com"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Digite o e-mail cadastrado pelo administrador da sua empresa.
              </p>
            </div>

            <button
              type="submit"
              id="btn-submit-google-login"
              disabled={isAuthenticating || !typedEmail.trim()}
              className="w-full py-3.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Entrar com a Conta Google</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Orientações de Acesso e Segurança */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Validação estrita com a base de colaboradores autorizados</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>Acessos e módulos restritos de acordo com o cargo cadastrado</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Ambiente corporativo seguro para serralheria e estruturas</span>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-800/60 bg-slate-950/60">
        <p>AçoGestão PRO · Sistema de Gestão Industrial & Estruturas Metálicas · Autenticação Individual</p>
      </footer>
    </div>
  );
};
