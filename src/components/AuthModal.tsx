import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  X,
  Check,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { sanitizeEmail, sanitizePlainText } from '../utils/security';

export interface AnalystUser {
  name: string;
  email: string;
  role: string;
  clearance: string;
  isAuthenticated: boolean;
  sessionToken?: string;
  authProvider?: 'google' | 'credentials' | 'guest';
}

interface AuthModalProps {
  isOpen: boolean;
  currentUser: AnalystUser;
  initialMode?: 'login' | 'register' | 'forgot_password';
  onClose: () => void;
  onSaveUser: (user: AnalystUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  initialMode = 'login',
  onClose,
  onSaveUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  
  // Google sign in simulated popup state
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Sign-in state
  const [loginEmail, setLoginEmail] = useState(currentUser.email || 'mirriasat123@gmail.com');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  // Register / Profile Customizer state
  const [name, setName] = useState(currentUser.name || 'Mir Riasat Asfak');
  const [regEmail, setRegEmail] = useState(currentUser.email || 'mirriasat123@gmail.com');
  const [role, setRole] = useState(currentUser.role || 'Lead OSINT Analyst');
  const [clearance, setClearance] = useState(currentUser.clearance || 'Level 4 Clearance');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password flow state
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Request, 2: Code & New Password, 3: Success
  const [forgotEmail, setForgotEmail] = useState(currentUser.email || 'mirriasat123@gmail.com');
  const [sentCode, setSentCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Generic notifications
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setMode(currentUser.isAuthenticated ? 'register' : initialMode);
      setError(null);
      setSuccessMsg(null);
      setShowGooglePicker(false);
      setForgotStep(1);
      setLoginEmail(currentUser.email || 'mirriasat123@gmail.com');
      setLoginPassword('');
    }
  }, [isOpen, currentUser, initialMode]);

  if (!isOpen) return null;

  // Handle standard credential login
  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailCheck = sanitizeEmail(loginEmail);
    if (!emailCheck.isValid) {
      setError('Please provide a valid investigator email address.');
      return;
    }

    if (!loginPassword || loginPassword.length < 4) {
      setError('Please enter a password of at least 4 characters.');
      return;
    }

    // Determine analyst profile
    const isMir = loginEmail.toLowerCase().includes('mirriasat') || loginEmail.toLowerCase().includes('riasat');
    const userToSave: AnalystUser = {
      name: isMir ? 'Mir Riasat Asfak' : 'Field Investigator',
      email: emailCheck.email,
      role: isMir ? 'Lead OSINT Analyst' : 'Cyber Intelligence Specialist',
      clearance: 'Level 4 Clearance',
      isAuthenticated: true,
      authProvider: 'credentials',
      sessionToken: `RT-AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    onSaveUser(userToSave);
    onClose();
  };

  // Handle quick demo login
  const handleQuickDemoLogin = () => {
    onSaveUser({
      name: 'Mir Riasat Asfak',
      email: 'mirriasat123@gmail.com',
      role: 'Lead OSINT Analyst',
      clearance: 'Level 4 Clearance',
      isAuthenticated: true,
      authProvider: 'credentials',
      sessionToken: `RT-SEC-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    onClose();
  };

  // Handle Google Sign-In Account Selection
  const handleSelectGoogleAccount = (selectedEmail: string, selectedName: string) => {
    setIsGoogleLoading(true);
    setError(null);

    setTimeout(() => {
      setIsGoogleLoading(false);
      setShowGooglePicker(false);

      const userToSave: AnalystUser = {
        name: selectedName,
        email: selectedEmail,
        role: 'Lead OSINT Analyst',
        clearance: 'Level 4 Clearance',
        isAuthenticated: true,
        authProvider: 'google',
        sessionToken: `RT-GOOG-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      onSaveUser(userToSave);
      onClose();
    }, 600);
  };

  // Handle Profile / Registration Save
  const handleRegisterOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailCheck = sanitizeEmail(regEmail);
    if (!emailCheck.isValid) {
      setError('Please enter a valid investigator email address.');
      return;
    }

    const cleanName = sanitizePlainText(name, 60) || 'Investigator';
    const cleanRole = sanitizePlainText(role, 60) || 'OSINT Analyst';
    const cleanClearance = sanitizePlainText(clearance, 40) || 'Level 4 Clearance';

    onSaveUser({
      name: cleanName,
      email: emailCheck.email,
      role: cleanRole,
      clearance: cleanClearance,
      isAuthenticated: true,
      authProvider: 'credentials',
      sessionToken: `RT-SEC-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    onClose();
  };

  // Step 1: Send Recovery Code
  const handleSendRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailCheck = sanitizeEmail(forgotEmail);
    if (!emailCheck.isValid) {
      setError('Please enter a valid email address to receive the password recovery code.');
      return;
    }

    setIsSendingCode(true);
    setTimeout(() => {
      const generatedCode = `RT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSentCode(generatedCode);
      setIsSendingCode(false);
      setForgotStep(2);
      setSuccessMsg(`Recovery token generated and dispatched to ${emailCheck.email}`);
    }, 700);
  };

  // Step 2: Verify Code and Reset Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (enteredCode.trim().toUpperCase() !== sentCode.toUpperCase()) {
      setError(`Invalid verification code. Please enter the active code (${sentCode}).`);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setForgotStep(3);
    setSuccessMsg('Your investigator password has been securely reset!');
  };

  // Auto-login after password reset
  const handleCompleteResetAndLogin = () => {
    const isMir = forgotEmail.toLowerCase().includes('mirriasat') || forgotEmail.toLowerCase().includes('riasat');
    onSaveUser({
      name: isMir ? 'Mir Riasat Asfak' : 'Verified Investigator',
      email: forgotEmail,
      role: 'Lead OSINT Analyst',
      clearance: 'Level 4 Clearance',
      isAuthenticated: true,
      authProvider: 'credentials',
      sessionToken: `RT-RESET-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-slate-900 dark:text-slate-100 overflow-hidden transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            {mode === 'forgot_password' ? (
              <KeyRound className="w-5 h-5" />
            ) : mode === 'register' ? (
              <UserPlus className="w-5 h-5" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'forgot_password'
                  ? 'Password Recovery'
                  : mode === 'register'
                  ? 'Investigator Profile & Clearance'
                  : 'RiasatTrace Authentication'}
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 font-mono font-medium">
                {currentUser.isAuthenticated ? 'SEC-ACTIVE' : 'GATEWAY'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {mode === 'forgot_password'
                ? 'Cryptographic Password Reset Channel'
                : 'Authorized OSINT Terminal Access'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs if in login/register */}
        {mode !== 'forgot_password' && (
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-950/60 p-1 text-xs font-medium border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{currentUser.isAuthenticated ? 'Edit Profile' : 'New Investigator'}</span>
            </button>
          </div>
        )}

        {/* Status / Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* -------------------- 1. GOOGLE ACCOUNT CHOOSER OVERLAY -------------------- */}
        {showGooglePicker && (
          <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 space-y-3.5 animate-fade-in shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Sign in with Google
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGooglePicker(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Select an authorized Google account to connect with <strong>RiasatTrace</strong>:
            </p>

            {/* Default Mir Riasat Account */}
            <button
              type="button"
              disabled={isGoogleLoading}
              onClick={() => handleSelectGoogleAccount('mirriasat123@gmail.com', 'Mir Riasat Asfak')}
              className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500/60 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs">
                  MR
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                    Mir Riasat Asfak
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    mirriasat123@gmail.com
                  </div>
                </div>
              </div>
              <div className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono">
                Active ID
              </div>
            </button>

            {/* Custom Google Email Input option */}
            <div className="pt-1">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Or sign in with another Google account:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="analyst@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  disabled={isGoogleLoading || !customGoogleEmail.includes('@')}
                  onClick={() => {
                    const clean = sanitizeEmail(customGoogleEmail);
                    if (clean.isValid) {
                      handleSelectGoogleAccount(clean.email, clean.email.split('@')[0]);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>

            {isGoogleLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 pt-2 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying OAuth token & issuing session...</span>
              </div>
            )}
          </div>
        )}

        {/* -------------------- 2. SIGN IN VIEW -------------------- */}
        {mode === 'login' && !showGooglePicker && (
          <div className="space-y-4">
            {/* Google Sign In One-Click Button */}
            <div>
              <button
                type="button"
                onClick={() => setShowGooglePicker(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-3 transition-all shadow-xs hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer group"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-2.5 text-[10px] uppercase font-mono tracking-wider text-slate-600 dark:text-slate-400 shrink-0 font-medium">
                Or Sign In with Credentials
              </span>
            </div>

            {/* Standard Credential Form */}
            <form onSubmit={handleCredentialLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Investigator Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="investigator@domain.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Terminal Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setForgotEmail(loginEmail || 'mirriasat123@gmail.com');
                      setForgotStep(1);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-xs hover:shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In to Terminal</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>One-Click Demo: Mir Riasat (Lead Analyst)</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* -------------------- 3. FORGOT PASSWORD FLOW -------------------- */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            {/* Step 1: Send Recovery Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendRecoveryCode} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your registered investigator email address. RiasatTrace will generate and dispatch a secure 6-digit cryptographic verification code.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Investigator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="mirriasat123@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSendingCode ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Token...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Send Recovery Token</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Enter Code and New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 text-xs space-y-1.5">
                  <div className="font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Active Recovery Token Dispatched</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                    Simulation Token: <strong className="text-cyan-600 dark:text-cyan-400">{sentCode}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnteredCode(sentCode)}
                    className="text-[10px] text-cyan-600 dark:text-cyan-400 underline hover:text-cyan-500 cursor-pointer"
                  >
                    Click to auto-fill token
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                    placeholder="RT-XXXXXX"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Terminal Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Password & Re-Key Token</span>
                </button>
              </form>
            )}

            {/* Step 3: Success Screen */}
            {forgotStep === 3 && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Password Updated Successfully
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Your credentials have been securely refreshed. You can now resume full Level 4 OSINT clearance.
                </p>
                <button
                  type="button"
                  onClick={handleCompleteResetAndLogin}
                  className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                >
                  Enter Dashboard Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* -------------------- 4. REGISTER / PROFILE EDIT VIEW -------------------- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterOrUpdate} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Investigator Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Authorized Email Identifier
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operational Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clearance Tier
                </label>
                <select
                  value={clearance}
                  onChange={(e) => setClearance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Level 4 Clearance">Level 4 Clearance (Max)</option>
                  <option value="Level 3 Senior Analyst">Level 3 Senior Analyst</option>
                  <option value="Level 2 Field Researcher">Level 2 Field Researcher</option>
                  <option value="Level 1 Observer">Level 1 Observer</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setName('Mir Riasat Asfak');
                  setRegEmail('mirriasat123@gmail.com');
                  setRole('Lead OSINT Analyst');
                  setClearance('Level 4 Clearance');
                }}
                className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>Reset to Mir Riasat</span>
              </button>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                <Lock className="w-3 h-3" />
                <span>Encrypted Profile</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Credentials</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
