import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
  Shield,
  KeyRound,
  GraduationCap,
  BookOpen,
  Brain,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Search,
  Maximize2,
  Check,
  Headphones,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  Cloud,
  Menu,
  X,
  Sparkles,
  LockKeyhole,
  ArrowUpRight,
  LoaderCircle,
  ClipboardCheck
} from 'lucide-react';
import { StorageService, formatEmbedUrl } from './storage';
import { AdminAuthError, SupabaseService } from './supabase';
import type {
  ExamToken,
  ParticipantRecord,
  ExamRecoverySession,
  EmbedSettings,
  ExamType,
  ToeflSectionKey,
  ProdiType,
} from './types';

export function App() {
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(StorageService.getTheme());
  const [savedExamSession] = useState<ExamRecoverySession | null>(() => StorageService.getExamSession());
  const [authCheckComplete, setAuthCheckComplete] = useState<boolean>(false);

  // Navigation Screens include recovery confirmation before a saved exam resumes.
  const [currentScreen, setCurrentScreen] = useState<string>(savedExamSession ? 'student_resume' : 'login');
  const [loginMode, setLoginMode] = useState<'student' | 'admin'>('student');

  // Student State
  const [inputToken, setInputToken] = useState<string>('');
  const [activeToken, setActiveToken] = useState<ExamToken | null>(savedExamSession?.token ?? null);
  const [studentName, setStudentName] = useState<string>(savedExamSession?.participant.name ?? '');
  const [studentNim, setStudentNim] = useState<string>(savedExamSession?.participant.nim ?? '');
  const [studentProdi, setStudentProdi] = useState<ProdiType>(savedExamSession?.participant.prodi ?? 'Akuntansi');
  const [currentParticipant, setCurrentParticipant] = useState<ParticipantRecord | null>(
    savedExamSession?.participant ?? null,
  );
  const [tokenError, setTokenError] = useState<string>('');
  const [resumeNim, setResumeNim] = useState<string>('');
  const [resumeError, setResumeError] = useState<string>('');

  // TOEFL 3-Section Progression
  const [currentToeflSection, setCurrentToeflSection] = useState<ToeflSectionKey>(
    savedExamSession?.currentToeflSection ?? 'listening',
  );
  const [completedSections, setCompletedSections] = useState<ToeflSectionKey[]>(
    savedExamSession?.completedSections ?? [],
  );

  // Section Countdown Timer (in seconds)
  const [sectionEndsAt, setSectionEndsAt] = useState<number>(savedExamSession?.sectionEndsAt ?? 0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    savedExamSession ? Math.max(0, Math.ceil((savedExamSession.sectionEndsAt - Date.now()) / 1000)) : 0,
  );
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Admin State
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  const [adminSidebarMenu, setAdminSidebarMenu] = useState<
    'overview' | 'tokens' | 'toefl_embeds' | 'tpa_embeds' | 'participants'
  >('overview');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState<boolean>(false);
  const [isExamMenuOpen, setIsExamMenuOpen] = useState<boolean>(false);

  // Shared Data
  const [tokens, setTokens] = useState<ExamToken[]>(StorageService.getTokens());
  const [participants, setParticipants] = useState<ParticipantRecord[]>(StorageService.getParticipants());
  const [embedSettings, setEmbedSettings] = useState<EmbedSettings>(StorageService.getSettings());
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Search & Filter in Admin
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterExam, setFilterExam] = useState<string>('all');
  const [filterProdi, setFilterProdi] = useState<string>('all');

  // Modals & UI States
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [editingToken, setEditingToken] = useState<ExamToken | null>(null);
  const [tokenFormData, setTokenFormData] = useState({
    code: '',
    name: '',
    examType: 'toefl' as ExamType,
    isActive: true,
    maxCapacity: 100,
    examDate: 'Hari 1 - Sesi TOEFL',
    note: '',
  });

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [isFinishConfirmModalOpen, setIsFinishConfirmModalOpen] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Apply Theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    StorageService.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    void SupabaseService.restoreAdminSession().then((hasAdminSession) => {
      if (!isMounted) return;
      if (hasAdminSession && !savedExamSession) {
        setCurrentScreen('admin_dashboard');
      }
      setAuthCheckComplete(true);
    });

    return () => {
      isMounted = false;
    };
  }, [savedExamSession]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync with Supabase on Initial Mount
  useEffect(() => {
    // Check Supabase connectivity
    SupabaseService.checkConnection().then((connected) => {
      setSupabaseConnected(connected);
    });

    // 1. Fetch Tokens from Supabase (or fallback to local)
    SupabaseService.fetchTokens().then((cloudTokens) => {
      if (cloudTokens && cloudTokens.length > 0) {
        setTokens(cloudTokens);
        StorageService.saveTokens(cloudTokens);
      }
    });

    // 2. Fetch Participants from Supabase
    SupabaseService.fetchParticipants().then((cloudParticipants) => {
      if (cloudParticipants && cloudParticipants.length > 0) {
        setParticipants(cloudParticipants);
        StorageService.saveParticipants(cloudParticipants);
      }
    });

    // 3. Fetch Settings from Supabase
    SupabaseService.fetchSettings().then((cloudSettings) => {
      if (cloudSettings) {
        setEmbedSettings(cloudSettings);
        StorageService.saveSettings(cloudSettings);
      }
    });
  }, []);

  // Section Countdown Timer Engine
  useEffect(() => {
    if (!timerRunning || sectionEndsAt <= 0) return;

    const updateRemainingTime = () => {
      const seconds = Math.max(0, Math.ceil((sectionEndsAt - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) setTimerRunning(false);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);
    document.addEventListener('visibilitychange', updateRemainingTime);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', updateRemainingTime);
    };
  }, [sectionEndsAt, timerRunning]);

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handler: Student Token Login
  const handleStudentTokenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');
    if (!inputToken.trim()) {
      setTokenError('Masukkan kode token ujian yang diberikan pengawas.');
      return;
    }

    const token = StorageService.findTokenByCode(inputToken);
    if (!token) {
      setTokenError('Token tidak ditemukan. Periksa kembali kode token.');
      return;
    }

    if (!token.isActive) {
      setTokenError('Token ini sedang dinonaktifkan oleh administrator lab. Hubungi pengawas.');
      return;
    }

    setActiveToken(token);
    setCurrentScreen('student_profile');
  };

  const handleResumeExam = (e: React.FormEvent) => {
    e.preventDefault();
    setResumeError('');

    const session = StorageService.getExamSession();
    if (!session || session.participant.status !== 'in_progress') {
      StorageService.clearExamSession();
      setCurrentScreen('login');
      void Swal.fire({
        icon: 'error',
        title: 'Sesi ujian tidak ditemukan',
        text: 'Silakan masukkan token ujian atau hubungi pengawas untuk mendapatkan bantuan.',
      });
      return;
    }

    if (resumeNim.trim().toLowerCase() !== session.participant.nim.trim().toLowerCase()) {
      setResumeError('NIM tidak sesuai dengan peserta pada sesi ujian yang tersimpan.');
      return;
    }

    setActiveToken(session.token);
    setStudentName(session.participant.name);
    setStudentNim(session.participant.nim);
    setStudentProdi(session.participant.prodi);
    setCurrentParticipant(session.participant);
    const localParticipants = StorageService.getParticipants();
    const participantExists = localParticipants.some((participant) => participant.id === session.participant.id);
    if (!participantExists) {
      StorageService.saveParticipants([session.participant, ...localParticipants]);
    }
    setParticipants(StorageService.getParticipants());
    setCurrentToeflSection(session.currentToeflSection);
    setCompletedSections(session.completedSections);
    setSectionEndsAt(session.sectionEndsAt);
    setRemainingSeconds(Math.max(0, Math.ceil((session.sectionEndsAt - Date.now()) / 1000)));
    setTimerRunning(true);
    setCurrentScreen('student_exam');
    void SupabaseService.upsertParticipant(session.participant);
  };

  // Handler: Student Complete Profile & Enter Exam
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentNim.trim()) {
      void Swal.fire({
        icon: 'warning',
        title: 'Data belum lengkap',
        text: 'Nama Lengkap dan NIM wajib diisi.',
      });
      return;
    }

    if (!activeToken) return;

    const examType = activeToken.examType;
    const examName =
      examType === 'toefl'
        ? 'TOEFL Like Prediction (3 Seksi)'
        : 'Tes Potensi Akademik (TPA)';

    const newRecord = StorageService.addParticipant({
      name: studentName.trim(),
      nim: studentNim.trim(),
      prodi: studentProdi,
      examType: examType,
      examName: examName,
      tokenCode: activeToken.code,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      currentSection: examType === 'toefl' ? 'Section 1: Listening' : 'Pengerjaan TPA',
      workstationId: 'WS-LAB-' + Math.floor(10 + Math.random() * 90),
    });

    // Save to local & sync to Supabase
    setCurrentParticipant(newRecord);
    setParticipants(StorageService.getParticipants());

    let sectionDurationSeconds: number;
    if (examType === 'toefl') {
      setCurrentToeflSection('listening');
      setCompletedSections([]);
      const listeningMinutes = embedSettings.toeflSections.listening.minutes || 35;
      sectionDurationSeconds = listeningMinutes * 60;
    } else {
      const tpaMinutes = embedSettings.tpa.minutes || 60;
      sectionDurationSeconds = tpaMinutes * 60;
    }

    const endsAt = Date.now() + sectionDurationSeconds * 1000;
    setSectionEndsAt(endsAt);
    setRemainingSeconds(sectionDurationSeconds);
    StorageService.saveExamSession({
      version: 1,
      participant: newRecord,
      token: activeToken,
      currentToeflSection: 'listening',
      completedSections: [],
      sectionEndsAt: endsAt,
    });
    void SupabaseService.upsertParticipant(newRecord);
    setTimerRunning(true);
    setCurrentScreen('student_exam');
  };

  // Switch to Next Section for TOEFL Like
  const handleNextToeflSection = (nextSec: ToeflSectionKey) => {
    const nextCompletedSections = completedSections.includes(currentToeflSection)
      ? completedSections
      : [...completedSections, currentToeflSection];
    setCompletedSections(nextCompletedSections);
    setIsExamMenuOpen(false);
    setCurrentToeflSection(nextSec);
    const secConfig = embedSettings.toeflSections[nextSec];
    const nextSectionEndsAt = Date.now() + secConfig.minutes * 60 * 1000;
    setSectionEndsAt(nextSectionEndsAt);
    setRemainingSeconds(Math.ceil((nextSectionEndsAt - Date.now()) / 1000));
    setTimerRunning(true);

    if (currentParticipant) {
      const currentSection = `Section: ${secConfig.shortName}`;
      StorageService.updateParticipantSection(currentParticipant.id, currentSection);
      const updatedParticipant = StorageService.getParticipants().find(
        (participant) => participant.id === currentParticipant.id,
      ) ?? { ...currentParticipant, currentSection };
      const savedSession = StorageService.getExamSession();
      if (savedSession) {
        StorageService.saveExamSession({
          ...savedSession,
          participant: updatedParticipant,
          currentToeflSection: nextSec,
          completedSections: nextCompletedSections,
          sectionEndsAt: nextSectionEndsAt,
        });
      }
      setParticipants(StorageService.getParticipants());
      void SupabaseService.upsertParticipant(updatedParticipant);
    }
  };

  // Finish Exam
  const handleConfirmFinishExam = () => {
    if (currentParticipant) {
      const updated = StorageService.completeParticipantExam(currentParticipant.id);
      if (updated) {
        setCurrentParticipant(updated);
        void SupabaseService.upsertParticipant(updated);
      }
      setParticipants(StorageService.getParticipants());
    }
    StorageService.clearExamSession();
    setTimerRunning(false);
    setIsFinishConfirmModalOpen(false);
    setCurrentScreen('student_completed');
  };

  // Handler: Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    try {
      await SupabaseService.signInAdmin(adminUsername, adminPassword);
      setCurrentScreen('admin_dashboard');
      setAdminPassword('');
    } catch (error) {
      console.error('Admin Supabase Auth sign-in failed:', error);
      if (error instanceof AdminAuthError) {
        if (error.code === 'not-configured') {
          setAdminError('Login admin belum dikonfigurasi. Pastikan VITE_ADMIN_USERNAME dan VITE_ADMIN_EMAIL diatur.');
        } else if (error.code === 'invalid-credentials') {
          setAdminError('Login ditolak Supabase. Pastikan user arief@stienas-ypb.ac.id ada di proyek qqjeajnrepmawqjqsuup, emailnya terkonfirmasi, lalu coba kata sandi akun Supabase yang benar. Jika lupa, atur ulang kata sandi dari Supabase Dashboard.');
        } else if (error.code === 'email-not-confirmed') {
          setAdminError('Email akun admin belum dikonfirmasi. Konfirmasikan user arief@stienas-ypb.ac.id pada Supabase Dashboard lalu coba lagi.');
        } else {
          setAdminError('Supabase Auth tidak dapat dihubungi. Periksa koneksi lalu coba lagi.');
        }
      } else {
        setAdminError('Login admin gagal karena layanan autentikasi bermasalah.');
      }
      setAdminPassword('');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await SupabaseService.signOutAdmin();
    } catch (error) {
      console.error('Admin Supabase Auth sign-out failed:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Gagal keluar',
        text: 'Sesi admin belum dapat diakhiri. Periksa koneksi lalu coba lagi.',
      });
      return;
    }
    setCurrentScreen('login');
    setLoginMode('student');
  };

  const handleToggleToken = (tokenId: string) => {
    const updated = StorageService.toggleTokenStatus(tokenId);
    setTokens(updated);
    const target = updated.find((t) => t.id === tokenId);
    if (target) {
      SupabaseService.upsertToken(target);
    }
  };

  const openTokenModal = (token?: ExamToken) => {
    if (token) {
      setEditingToken(token);
      setTokenFormData({
        code: token.code,
        name: token.name,
        examType: token.examType,
        isActive: token.isActive,
        maxCapacity: token.maxCapacity || 100,
        examDate: token.examDate || 'Hari 1 - Sesi TOEFL',
        note: token.note || '',
      });
    } else {
      setEditingToken(null);
      const isTpa = adminSidebarMenu === 'tpa_embeds';
      const prefix = isTpa ? 'TPA' : 'TOEFL';
      setTokenFormData({
        code: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
        name: isTpa ? 'Hari 2: Sesi Ujian TPA Baru' : 'Hari 1: Sesi Ujian TOEFL Baru',
        examType: isTpa ? 'tpa' : 'toefl',
        isActive: true,
        maxCapacity: 100,
        examDate: isTpa ? 'Hari 2 - Sesi TPA' : 'Hari 1 - Sesi TOEFL',
        note: '',
      });
    }
    setIsTokenModalOpen(true);
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenFormData.code.trim()) {
      void Swal.fire({
        icon: 'warning',
        title: 'Kode token wajib diisi',
      });
      return;
    }

    const tokenToSave: ExamToken = {
      id: editingToken ? editingToken.id : `tok-${Date.now()}`,
      code: tokenFormData.code.trim().toUpperCase(),
      name: tokenFormData.name.trim() || 'Sesi Ujian Akademik',
      examType: tokenFormData.examType,
      isActive: tokenFormData.isActive,
      createdAt: editingToken ? editingToken.createdAt : new Date().toISOString(),
      usedCount: editingToken ? editingToken.usedCount : 0,
      maxCapacity: Number(tokenFormData.maxCapacity) || 100,
      examDate: tokenFormData.examDate,
      note: tokenFormData.note.trim(),
    };

    const updated = StorageService.saveToken(tokenToSave);
    setTokens(updated);
    SupabaseService.upsertToken(tokenToSave);
    setIsTokenModalOpen(false);
  };

  const handleDeleteToken = async (tokenId: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus token ini?',
      text: 'Token yang dihapus tidak dapat dipulihkan.',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (result.isConfirmed) {
      const updated = StorageService.deleteToken(tokenId);
      setTokens(updated);
      SupabaseService.deleteToken(tokenId);
    }
  };

  const handleCopyToken = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopyFeedback(code);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleSaveEmbedSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(embedSettings);
    const savedToCloud = await SupabaseService.saveSettings(embedSettings);
    await Swal.fire({
      icon: savedToCloud ? 'success' : 'warning',
      title: savedToCloud ? 'Pengaturan tersimpan' : 'Tersimpan di perangkat ini',
      text: savedToCloud
        ? 'Pengaturan link sematan Google Form dan waktu ujian berhasil disimpan.'
        : 'Pengaturan tersimpan lokal, tetapi gagal disinkronkan ke Supabase.',
    });
  };

  const handleExportParticipants = () => {
    if (!StorageService.exportParticipantsToCSV()) {
      void Swal.fire({
        icon: 'info',
        title: 'Belum ada data peserta',
        text: 'Belum ada data peserta untuk diunduh.',
      });
    }
  };

  const handleOpenPreview = (url: string, title: string) => {
    setPreviewUrl(formatEmbedUrl(url));
    setPreviewTitle(title);
    setIsPreviewModalOpen(true);
  };

  // Filtered Participants in Admin
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prodi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tokenCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = filterExam === 'all' || p.examType === filterExam;
    const matchesProdi = filterProdi === 'all' || p.prodi === filterProdi;
    return matchesSearch && matchesExam && matchesProdi;
  });

  // Calculate Active URL for Student
  const currentStudentUrl = () => {
    if (!activeToken) return '';
    if (activeToken.examType === 'toefl') {
      const sec = embedSettings.toeflSections[currentToeflSection];
      return formatEmbedUrl(sec?.url || '');
    } else {
      return formatEmbedUrl(embedSettings.tpa?.url || '');
    }
  };

  return (
    <div className="app-container">
      {/* =========================================================================
          SCREEN 1: LOGIN PORTAL (SIMPLE & CLEAN)
          ========================================================================= */}
      {currentScreen === 'login' && (
        !authCheckComplete ? (
          <main className="auth-restoring-screen" aria-live="polite">
            <div className="auth-restoring-card">
              <div className="login-brand-mark"><GraduationCap size={24} /></div>
              <span>EduCore</span>
              <LoaderCircle className="auth-restoring-spinner" size={22} />
              <p>Memeriksa sesi dengan aman...</p>
            </div>
          </main>
        ) : (
          <main className="login-wrapper">
            <header className="login-topbar">
              <a className="login-brand" href={import.meta.env.BASE_URL} aria-label="EduCore beranda">
                <span className="login-brand-mark"><GraduationCap size={23} /></span>
                <span>
                  <strong>EduCore</strong>
                  <small>STIE Nasional Banjarmasin</small>
                </span>
              </a>
              <button type="button" onClick={toggleTheme} className="theme-toggle-btn" title="Ganti Tema">
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </header>

            <div className="login-showcase">
              <section className="login-hero">
                <div className="login-hero-orbit login-hero-orbit-one" />
                <div className="login-hero-orbit login-hero-orbit-two" />
                <div className="login-hero-content">
                  <div className="login-eyebrow"><Sparkles size={14} /> PORTAL AKADEMIK DIGITAL</div>
                  <h1>Fokus pada potensi.<br /><span>Raih pencapaian.</span></h1>
                  <p>
                    Satu ruang digital untuk mengerjakan ujian dengan lebih terarah, nyaman, dan terukur.
                  </p>
                  <div className="login-exam-highlights">
                    <div className="login-exam-highlight">
                      <span className="login-highlight-icon"><Headphones size={19} /></span>
                      <span><strong>TOEFL Like</strong><small>Listening · Structure · Reading</small></span>
                      <ArrowUpRight size={17} />
                    </div>
                    <div className="login-exam-highlight">
                      <span className="login-highlight-icon login-highlight-icon-tpa"><Brain size={19} /></span>
                      <span><strong>Tes Potensi Akademik</strong><small>Uji logika dan kemampuan analitis</small></span>
                      <ArrowUpRight size={17} />
                    </div>
                  </div>
                </div>
                <div className="login-hero-footer">
                  <span><Shield size={14} /> Akses terlindungi</span>
                  <span>Platform ujian STIENAS</span>
                </div>
              </section>

              <section className="login-panel">
                <div className="login-panel-heading">
                  <span className="login-panel-kicker">SELAMAT DATANG</span>
                  <h2>{loginMode === 'student' ? 'Mulai dengan percaya diri' : 'Ruang kerja pengelola'}</h2>
                  <p>
                    {loginMode === 'student'
                      ? 'Masukkan kode sesi yang diberikan oleh pengawas.'
                      : 'Masuk untuk mengelola sesi dan layanan ujian.'}
                  </p>
                </div>

                <div className="login-mode-switcher" aria-label="Pilih akses">
                  <button
                    type="button"
                    className={`login-mode-option ${loginMode === 'student' ? 'active' : ''}`}
                    onClick={() => {
                      setLoginMode('student');
                      setTokenError('');
                    }}
                  >
                    <ClipboardCheck size={17} /> Ikuti Ujian
                  </button>
                  <button
                    type="button"
                    className={`login-mode-option ${loginMode === 'admin' ? 'active' : ''}`}
                    onClick={() => {
                      setLoginMode('admin');
                      setAdminError('');
                    }}
                  >
                    <LockKeyhole size={17} /> Akses Pengelola
                  </button>
                </div>

                {loginMode === 'student' && (
                  <form className="login-form" onSubmit={handleStudentTokenLogin}>
                    <label className="form-label" htmlFor="exam-token">Kode sesi ujian</label>
                    <div className="login-input-wrap token-input-hero">
                      <KeyRound size={18} />
                      <input
                        id="exam-token"
                        type="text"
                        value={inputToken}
                        onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                        placeholder="Contoh: EDU-AB12"
                        autoComplete="off"
                        autoFocus
                        required
                      />
                    </div>

                    {tokenError && (
                      <div className="login-error" role="alert">
                        <AlertCircle size={16} /><span>{tokenError}</span>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg login-submit">
                      Lanjutkan <ArrowRight size={17} />
                    </button>
                    <p className="login-helper"><Shield size={14} /> Pastikan kode sesuai informasi pengawas.</p>
                  </form>
                )}

                {loginMode === 'admin' && (
                  <form className="login-form" onSubmit={handleAdminLogin}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="admin-username">ID Pengelola</label>
                      <input
                        id="admin-username"
                        type="text"
                        className="form-input"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Masukkan ID pengelola"
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="admin-password">Kata sandi</label>
                      <input
                        id="admin-password"
                        type="password"
                        className="form-input"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    {adminError && (
                      <div className="login-error" role="alert">
                        <AlertCircle size={16} /><span>{adminError}</span>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg login-submit">
                      Masuk dengan aman <ArrowRight size={17} />
                    </button>
                    <p className="login-helper"><LockKeyhole size={14} /> Sesi aman dikelola oleh Supabase Auth.</p>
                  </form>
                )}

                <div className="login-panel-footer">
                  <span>TPA & TOEFL Like</span><span>•</span><span>STIE Nasional Banjarmasin</span>
                </div>
              </section>
            </div>
          </main>
        )
      )}

      {currentScreen === 'student_resume' && savedExamSession && (
        <main style={{ maxWidth: '580px', margin: '3.5rem auto', padding: '0 1.25rem', width: '100%' }}>
          <div className="clean-card">
            <div style={{ marginBottom: '1.25rem' }}>
              <span className="badge badge-active" style={{ marginBottom: '0.5rem' }}>
                Sesi ujian ditemukan
              </span>
              <h2 style={{ fontSize: '1.35rem' }}>Lanjutkan Ujian</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Sesi {savedExamSession.token.examType === 'toefl' ? 'TOEFL Like' : 'TPA'} untuk{' '}
                <strong>{savedExamSession.participant.name}</strong> tersimpan di browser ini.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
              }}
            >
              <div><strong>Token:</strong> {savedExamSession.token.code}</div>
              <div>
                <strong>Bagian:</strong>{' '}
                {savedExamSession.token.examType === 'toefl'
                  ? embedSettings.toeflSections[savedExamSession.currentToeflSection].shortName
                  : 'TPA'}
              </div>
              <div>
                <strong>Sisa waktu:</strong>{' '}
                {formatTime(Math.max(0, Math.ceil((savedExamSession.sectionEndsAt - Date.now()) / 1000)))}
              </div>
            </div>

            <form onSubmit={handleResumeExam}>
              <div className="form-group">
                <label className="form-label">Verifikasi NIM untuk melanjutkan</label>
                <input
                  type="text"
                  className="form-input"
                  value={resumeNim}
                  onChange={(event) => setResumeNim(event.target.value)}
                  placeholder="Masukkan NIM"
                  autoComplete="off"
                  required
                  autoFocus
                />
              </div>

              {resumeError && (
                <div
                  role="alert"
                  style={{
                    background: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    color: '#ef4444',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem',
                    marginBottom: '1rem',
                  }}
                >
                  {resumeError}
                </div>
              )}

              <div
                style={{
                  background: 'rgba(217, 119, 6, 0.08)',
                  border: '1px solid rgba(217, 119, 6, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  padding: '0.75rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.78rem',
                }}
              >
                Posisi ujian dan timer dipulihkan dari browser ini. Jawaban yang belum dikirim berada di
                Google Form dan tidak dapat dibaca atau disimpan oleh EduCore; pemulihannya bergantung
                pada fitur draf Google Form dan akun Google peserta. Kirim jawaban sebelum menutup
                halaman bila memungkinkan.
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Lanjutkan ke Ujian <ChevronRight size={16} />
              </button>
            </form>
          </div>
        </main>
      )}

      {/* =========================================================================
          SCREEN 2: DATA DIRI MAHASISWA (SIMPLE & CLEAN)
          ========================================================================= */}
      {currentScreen === 'student_profile' && activeToken && (
        <main style={{ maxWidth: '580px', margin: '3.5rem auto', padding: '0 1.25rem', width: '100%' }}>
          <div style={{ position: 'fixed', top: '1.25rem', right: '1.5rem', zIndex: 100 }}>
            <button type="button" onClick={toggleTheme} className="theme-toggle-btn">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <div className="clean-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-active" style={{ marginBottom: '0.35rem' }}>
                  Token: {activeToken.code}
                </span>
                <h2 style={{ fontSize: '1.35rem' }}>Data Diri Peserta Ujian</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  {activeToken.examType === 'toefl' ? 'TOEFL Like Prediction (3 Seksi)' : 'Tes Potensi Akademik (TPA)'}
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap Mahasiswa *</label>
                <input
                  type="text"
                  className="form-input"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nama Lengkap"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Induk Mahasiswa (NIM) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={studentNim}
                  onChange={(e) => setStudentNim(e.target.value)}
                  placeholder="NIM"
                  required
                />
              </div>

              {/* KHUSUS PILIHAN PRODI: AKUNTANSI & MANAJEMEN */}
              <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                <label className="form-label">Pilih Program Studi *</label>
                <div className="radio-cards-grid">
                  <div
                    className={`radio-card ${studentProdi === 'Akuntansi' ? 'selected' : ''}`}
                    onClick={() => setStudentProdi('Akuntansi')}
                  >
                    <div className="radio-indicator"></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>Akuntansi</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>S1 Akuntansi</div>
                    </div>
                  </div>

                  <div
                    className={`radio-card ${studentProdi === 'Manajemen' ? 'selected' : ''}`}
                    onClick={() => setStudentProdi('Manajemen')}
                  >
                    <div className="radio-indicator"></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>Manajemen</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>S1 Manajemen</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Seksi */}
              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {activeToken.examType === 'toefl' ? (
                  <div>
                    <strong>Rangkaian Seksi TOEFL:</strong> Listening ({embedSettings.toeflSections.listening.minutes}m), Structure ({embedSettings.toeflSections.structure.minutes}m), Reading ({embedSettings.toeflSections.reading.minutes}m).
                  </div>
                ) : (
                  <div>
                    <strong>Ujian TPA:</strong> Durasi pengerjaan {embedSettings.tpa.minutes} Menit.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentScreen('login')}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Mulai Ujian <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </main>
      )}

      {/* =========================================================================
          SCREEN 3: RUANG UJIAN MAHASISWA (CLEAN & SIMPLE)
          ========================================================================= */}
      {currentScreen === 'student_exam' && activeToken && (
        <div className="exam-layout-with-sidebar">
          {/* SIDEBAR UJIAN */}
          <aside
            id="exam-navigation"
            className={`exam-sidebar ${isFullscreen ? 'fullscreen-hidden' : ''} ${isExamMenuOpen ? 'mobile-open' : ''}`}
          >
            {/* Header Profil */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peserta</span>
                <button type="button" onClick={toggleTheme} className="theme-toggle-btn" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>
                  {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                </button>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{studentName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {studentNim} • {studentProdi}
              </div>
            </div>

            {/* COUNTDOWN TIMER */}
            <div className="section-timer-box">
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                {activeToken.examType === 'toefl'
                  ? `Sisa Waktu ${embedSettings.toeflSections[currentToeflSection].shortName}:`
                  : 'Sisa Waktu:'}
              </div>
              <div className={`timer-digits ${remainingSeconds < 300 ? (remainingSeconds < 60 ? 'danger-time' : 'warning-time') : ''}`}>
                {formatTime(remainingSeconds)}
              </div>
            </div>

            {/* TOEFL 3-SECTION PROGRESS STEPPER */}
            {activeToken.examType === 'toefl' && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Tahapan TOEFL
                </div>

                <div className="section-stepper-container">
                  {/* Section 1 */}
                  <div className={`section-step-card ${currentToeflSection === 'listening' ? 'active-step' : ''} ${completedSections.includes('listening') ? 'completed-step' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="section-step-number">{completedSections.includes('listening') ? <Check size={12} /> : '1'}</div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 500 }}>Listening</div>
                    </div>
                    {currentToeflSection === 'listening' && <span className="badge badge-toefl" style={{ fontSize: '0.7rem' }}>Aktif</span>}
                  </div>

                  {/* Section 2 */}
                  <div className={`section-step-card ${currentToeflSection === 'structure' ? 'active-step' : ''} ${completedSections.includes('structure') ? 'completed-step' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="section-step-number">{completedSections.includes('structure') ? <Check size={12} /> : '2'}</div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 500 }}>Structure</div>
                    </div>
                    {currentToeflSection === 'structure' && <span className="badge badge-toefl" style={{ fontSize: '0.7rem' }}>Aktif</span>}
                  </div>

                  {/* Section 3 */}
                  <div className={`section-step-card ${currentToeflSection === 'reading' ? 'active-step' : ''} ${completedSections.includes('reading') ? 'completed-step' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="section-step-number">{completedSections.includes('reading') ? <Check size={12} /> : '3'}</div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 500 }}>Reading</div>
                    </div>
                    {currentToeflSection === 'reading' && <span className="badge badge-toefl" style={{ fontSize: '0.7rem' }}>Aktif</span>}
                  </div>
                </div>

                {/* Section Navigation Buttons */}
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {currentToeflSection === 'listening' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        void Swal.fire({
                          icon: 'question',
                          title: 'Lanjut ke Structure?',
                          text: 'Pastikan Anda sudah menekan tombol KIRIM pada Form Listening sebelum lanjut ke Section 2: Structure.',
                          showCancelButton: true,
                          confirmButtonText: 'Lanjut',
                          cancelButtonText: 'Batal',
                        }).then(({ isConfirmed }) => {
                          if (isConfirmed) {
                            handleNextToeflSection('structure');
                          }
                        });
                      }}
                    >
                      Lanjut ke Section 2 (Structure) <ChevronRight size={14} />
                    </button>
                  )}

                  {currentToeflSection === 'structure' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        void Swal.fire({
                          icon: 'question',
                          title: 'Lanjut ke Reading?',
                          text: 'Pastikan Anda sudah menekan tombol KIRIM pada Form Structure sebelum lanjut ke Section 3: Reading.',
                          showCancelButton: true,
                          confirmButtonText: 'Lanjut',
                          cancelButtonText: 'Batal',
                        }).then(({ isConfirmed }) => {
                          if (isConfirmed) {
                            handleNextToeflSection('reading');
                          }
                        });
                      }}
                    >
                      Lanjut ke Section 3 (Reading) <ChevronRight size={14} />
                    </button>
                  )}

                  {currentToeflSection === 'reading' && (
                    <button
                      type="button"
                      className="btn btn-emerald btn-sm"
                      onClick={() => {
                        setIsExamMenuOpen(false);
                        setIsFinishConfirmModalOpen(true);
                      }}
                    >
                      <CheckCircle2 size={15} /> Selesaikan Seluruh TOEFL
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TPA EXAM INFO */}
            {activeToken.examType === 'tpa' && (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Kerjakan soal TPA langsung pada lembar formulir di samping.
                </p>
                <button
                  type="button"
                  className="btn btn-emerald btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setIsExamMenuOpen(false);
                    setIsFinishConfirmModalOpen(true);
                  }}
                >
                  <CheckCircle2 size={15} /> Selesaikan Ujian TPA
                </button>
              </div>
            )}

            {/* Sidebar Bottom Controls */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.src = currentStudentUrl();
                  }
                }}
              >
                <RefreshCw size={13} /> Muat Ulang Form
              </button>
            </div>
          </aside>
          {isExamMenuOpen && !isFullscreen && (
            <button
              type="button"
              className="mobile-menu-backdrop"
              aria-label="Tutup menu ujian"
              onClick={() => setIsExamMenuOpen(false)}
            />
          )}

          {/* MAIN PANEL */}
          <main className="exam-main-panel">
            <div className="exam-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!isFullscreen && (
                  <button
                    type="button"
                    className="mobile-menu-trigger exam-menu-trigger"
                    aria-label={isExamMenuOpen ? 'Tutup menu ujian' : 'Buka menu ujian'}
                    aria-expanded={isExamMenuOpen}
                    aria-controls="exam-navigation"
                    onClick={() => setIsExamMenuOpen((open) => !open)}
                  >
                    {isExamMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                )}
                <span className="exam-mobile-brand">EduCore</span>
                <span className={`badge ${activeToken.examType === 'toefl' ? 'badge-toefl' : 'badge-tpa'}`}>
                  {activeToken.examType === 'toefl'
                    ? embedSettings.toeflSections[currentToeflSection].shortName
                    : 'TPA'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Durasi: {activeToken.examType === 'toefl' ? `${embedSettings.toeflSections[currentToeflSection].minutes}m` : `${embedSettings.tpa.minutes}m`}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <a
                  href={currentStudentUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  title="Buka Form di Tab Baru"
                >
                  <ExternalLink size={13} /> Tab Baru
                </a>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIsFullscreen((fullscreen) => !fullscreen);
                    setIsExamMenuOpen(false);
                  }}
                >
                  <Maximize2 size={13} /> {isFullscreen ? 'Buka Sidebar' : 'Layar Penuh'}
                </button>
              </div>
            </div>

            {/* Audio Strip */}
            {activeToken.examType === 'toefl' &&
              currentToeflSection === 'listening' &&
              embedSettings.listeningAudioUrl && (
                <div className="audio-listening-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Headphones size={18} color="var(--primary)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      Audio Listening Section 1:
                    </span>
                  </div>
                  <audio
                    controls
                    controlsList="nodownload"
                    style={{ height: '32px', maxWidth: '380px', width: '100%' }}
                    src={embedSettings.listeningAudioUrl}
                  >
                    Browser Anda tidak mendukung audio.
                  </audio>
                </div>
              )}

            {/* Iframe */}
            <div className="exam-iframe-container">
              <iframe
                ref={iframeRef}
                src={currentStudentUrl()}
                className="exam-iframe"
                title="Google Form Ujian"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </main>
        </div>
      )}

      {/* =========================================================================
          SCREEN 4: BUKTI SELESAI UJIAN (CLEAN & SIMPLE)
          ========================================================================= */}
      {currentScreen === 'student_completed' && (
        <main style={{ maxWidth: '540px', margin: '3.5rem auto', padding: '0 1.25rem', width: '100%' }}>
          <div style={{ position: 'fixed', top: '1.25rem', right: '1.5rem', zIndex: 100 }}>
            <button type="button" onClick={toggleTheme} className="theme-toggle-btn">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <div className="clean-card" style={{ textAlign: 'center', padding: '2.5rem 1.75rem' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(22, 163, 74, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Ujian Selesai</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Data pengerjaan Anda telah tersimpan secara resmi di sistem.
            </p>

            {/* Kartu Bukti Ujian */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>Nama:</span>
                  <div style={{ fontWeight: 600 }}>{studentName}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>NIM:</span>
                  <div style={{ fontWeight: 600 }}>{studentNim}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>Prodi:</span>
                  <div style={{ fontWeight: 600 }}>{studentProdi}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>Token:</span>
                  <div style={{ fontWeight: 600 }}>{activeToken?.code}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>Ujian:</span>
                  <div style={{ fontWeight: 600 }}>{activeToken?.examType === 'toefl' ? 'TOEFL Like' : 'TPA'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>Waktu:</span>
                  <div style={{ fontWeight: 600 }}>{new Date().toLocaleTimeString('id-ID')}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={15} /> Cetak Bukti
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setCurrentScreen('login');
                  setActiveToken(null);
                  setStudentName('');
                  setStudentNim('');
                }}
              >
                <LogOut size={15} /> Selesai
              </button>
            </div>
          </div>
        </main>
      )}

      {/* =========================================================================
          SCREEN 5: ADMIN DASHBOARD (CLEAN & SIMPLE)
          ========================================================================= */}
      {currentScreen === 'admin_dashboard' && (
        <div className="app-layout-sidebar">
          {/* SIDEBAR */}
          <aside
            id="admin-navigation"
            className={`sidebar-container ${isAdminMenuOpen ? 'mobile-open' : ''}`}
          >
            <div className="sidebar-header">
              <div>
                <div className="sidebar-brand-title">EduCore</div>
                <div className="sidebar-brand-sub">TPA & TOEFL Like</div>
              </div>
              <div className="sidebar-header-actions">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="theme-toggle-btn"
                  style={{ padding: '0.3rem', color: '#ffffff' }}
                  aria-label="Ganti tema"
                >
                  {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                </button>
                <button
                  type="button"
                  className="mobile-menu-close"
                  aria-label="Tutup menu admin"
                  onClick={() => setIsAdminMenuOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <nav className="sidebar-nav">
              <button
                type="button"
                className={`sidebar-item ${adminSidebarMenu === 'overview' ? 'active' : ''}`}
                onClick={() => {
                  setAdminSidebarMenu('overview');
                  setIsAdminMenuOpen(false);
                }}
              >
                <SlidersHorizontal size={16} /> Ringkasan
              </button>

              <button
                type="button"
                className={`sidebar-item ${adminSidebarMenu === 'tokens' ? 'active' : ''}`}
                onClick={() => {
                  setAdminSidebarMenu('tokens');
                  setIsAdminMenuOpen(false);
                }}
              >
                <KeyRound size={16} /> Token ({tokens.length})
              </button>

              <button
                type="button"
                className={`sidebar-item ${adminSidebarMenu === 'toefl_embeds' ? 'active' : ''}`}
                onClick={() => {
                  setAdminSidebarMenu('toefl_embeds');
                  setIsAdminMenuOpen(false);
                }}
              >
                <BookOpen size={16} /> Form TOEFL (3 Seksi)
              </button>

              <button
                type="button"
                className={`sidebar-item ${adminSidebarMenu === 'tpa_embeds' ? 'active' : ''}`}
                onClick={() => {
                  setAdminSidebarMenu('tpa_embeds');
                  setIsAdminMenuOpen(false);
                }}
              >
                <Brain size={16} /> Form TPA
              </button>

              <button
                type="button"
                className={`sidebar-item ${adminSidebarMenu === 'participants' ? 'active' : ''}`}
                onClick={() => {
                  setAdminSidebarMenu('participants');
                  setIsAdminMenuOpen(false);
                }}
              >
                <FileSpreadsheet size={16} /> Rekap Peserta ({participants.length})
              </button>
            </nav>

            <div className="sidebar-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', color: '#94a3b8', padding: '0.25rem 0' }}>
                <Cloud size={13} color={supabaseConnected ? '#16a34a' : '#d97706'} />
                <span>Supabase: {supabaseConnected ? 'Terhubung' : 'Lokal (Siap Sync)'}</span>
              </div>

              <button
                type="button"
                className="btn btn-emerald btn-sm"
                onClick={handleExportParticipants}
                style={{ width: '100%' }}
              >
                <Download size={14} /> Download Excel/CSV
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAdminLogout}
                style={{ width: '100%', color: '#ffffff', background: 'rgba(255,255,255,0.06)' }}
              >
                <LogOut size={14} /> Keluar
              </button>
            </div>
          </aside>
          {isAdminMenuOpen && (
            <button
              type="button"
              className="mobile-menu-backdrop"
              aria-label="Tutup menu admin"
              onClick={() => setIsAdminMenuOpen(false)}
            />
          )}

          {/* MAIN CONTENT */}
          <main className="sidebar-content-area">
            <div className="admin-mobile-topbar">
              <button
                type="button"
                className="mobile-menu-trigger"
                aria-label={isAdminMenuOpen ? 'Tutup menu admin' : 'Buka menu admin'}
                aria-expanded={isAdminMenuOpen}
                aria-controls="admin-navigation"
                onClick={() => setIsAdminMenuOpen((open) => !open)}
              >
                {isAdminMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div>
                <strong>EduCore</strong>
                <span>Panel Administrator</span>
              </div>
            </div>
            {/* OVERVIEW */}
            {adminSidebarMenu === 'overview' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem' }}>Ringkasan Sesi Ujian</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      Status token dan peserta ujian TOEFL Like serta TPA
                    </p>
                  </div>
                  <button onClick={() => openTokenModal()} className="btn btn-primary btn-sm">
                    <Plus size={15} /> Buat Token Baru
                  </button>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-info">
                      <h3>Token Aktif</h3>
                      <div className="stat-value">{tokens.filter((t) => t.isActive).length} / {tokens.length}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <h3>Total Peserta</h3>
                      <div className="stat-value">{participants.length}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <h3>Akuntansi</h3>
                      <div className="stat-value">{participants.filter((p) => p.prodi === 'Akuntansi').length}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <h3>Manajemen</h3>
                      <div className="stat-value">{participants.filter((p) => p.prodi === 'Manajemen').length}</div>
                    </div>
                  </div>
                </div>

                {/* Status Box */}
                <div className="clean-card" style={{ marginTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem' }}>Status Link Soal Google Form Aktif</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <span>1. Listening ({embedSettings.toeflSections.listening.minutes}m):</span>
                      <span style={{ color: 'var(--text-muted)' }}>{embedSettings.toeflSections.listening.url.slice(0, 50)}...</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <span>2. Structure ({embedSettings.toeflSections.structure.minutes}m):</span>
                      <span style={{ color: 'var(--text-muted)' }}>{embedSettings.toeflSections.structure.url.slice(0, 50)}...</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <span>3. Reading ({embedSettings.toeflSections.reading.minutes}m):</span>
                      <span style={{ color: 'var(--text-muted)' }}>{embedSettings.toeflSections.reading.url.slice(0, 50)}...</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <span>4. TPA ({embedSettings.tpa.minutes}m):</span>
                      <span style={{ color: 'var(--text-muted)' }}>{embedSettings.tpa.url.slice(0, 50)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TOKENS */}
            {adminSidebarMenu === 'tokens' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem' }}>Manajemen Token Ujian</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      Kelola token untuk Hari 1 (TOEFL) dan Hari 2 (TPA)
                    </p>
                  </div>
                  <button onClick={() => openTokenModal()} className="btn btn-primary btn-sm">
                    <Plus size={15} /> Buat Token
                  </button>
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Kode Token</th>
                        <th>Jadwal / Sesi</th>
                        <th>Ujian</th>
                        <th>Pakai</th>
                        <th style={{ textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map((tok) => (
                        <tr key={tok.id}>
                          <td>
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={tok.isActive}
                                onChange={() => handleToggleToken(tok.id)}
                              />
                              <span className="slider"></span>
                            </label>
                          </td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{tok.code}</span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.15rem 0.35rem' }}
                                onClick={() => handleCopyToken(tok.code)}
                                title="Salin Token"
                              >
                                {copyFeedback === tok.code ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td>{tok.name}</td>
                          <td>
                            <span className={`badge ${tok.examType === 'toefl' ? 'badge-toefl' : 'badge-tpa'}`}>
                              {tok.examType.toUpperCase()}
                            </span>
                          </td>
                          <td>{tok.usedCount}x</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button onClick={() => openTokenModal(tok)} className="btn btn-secondary btn-sm">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => handleDeleteToken(tok.id)} className="btn btn-danger btn-sm">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TOEFL EMBEDS */}
            {adminSidebarMenu === 'toefl_embeds' && (
              <div style={{ maxWidth: '780px' }}>
                <div className="clean-card">
                  <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Pengaturan 3 Link Form TOEFL Like</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
                    Sematkan Google Form resmi untuk masing-masing seksi
                  </p>

                  <form onSubmit={handleSaveEmbedSettings}>
                    {/* SECTION 1 */}
                    <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section 1: Listening Comprehension</span>
                        <button type="button" onClick={() => handleOpenPreview(embedSettings.toeflSections.listening.url, 'Preview Listening')} className="btn btn-ghost btn-sm">
                          <Eye size={13} /> Preview
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={embedSettings.toeflSections.listening.url}
                        onChange={(e) =>
                          setEmbedSettings({
                            ...embedSettings,
                            toeflSections: {
                              ...embedSettings.toeflSections,
                              listening: { ...embedSettings.toeflSections.listening, url: e.target.value },
                            },
                          })
                        }
                        required
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Durasi (Menit)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={embedSettings.toeflSections.listening.minutes}
                            onChange={(e) =>
                              setEmbedSettings({
                                ...embedSettings,
                                toeflSections: {
                                  ...embedSettings.toeflSections,
                                  listening: { ...embedSettings.toeflSections.listening, minutes: Number(e.target.value) },
                                },
                              })
                            }
                            required
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Audio URL (MP3)</label>
                          <input
                            type="url"
                            className="form-input"
                            value={embedSettings.listeningAudioUrl || ''}
                            onChange={(e) => setEmbedSettings({ ...embedSettings, listeningAudioUrl: e.target.value })}
                            placeholder="URL File Audio"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2 */}
                    <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section 2: Structure & Written Expression</span>
                        <button type="button" onClick={() => handleOpenPreview(embedSettings.toeflSections.structure.url, 'Preview Structure')} className="btn btn-ghost btn-sm">
                          <Eye size={13} /> Preview
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={embedSettings.toeflSections.structure.url}
                        onChange={(e) =>
                          setEmbedSettings({
                            ...embedSettings,
                            toeflSections: {
                              ...embedSettings.toeflSections,
                              structure: { ...embedSettings.toeflSections.structure, url: e.target.value },
                            },
                          })
                        }
                        required
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <div>
                        <label className="form-label">Durasi (Menit)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={embedSettings.toeflSections.structure.minutes}
                          onChange={(e) =>
                            setEmbedSettings({
                              ...embedSettings,
                              toeflSections: {
                                ...embedSettings.toeflSections,
                                structure: { ...embedSettings.toeflSections.structure, minutes: Number(e.target.value) },
                              },
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* SECTION 3 */}
                    <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Section 3: Reading Comprehension</span>
                        <button type="button" onClick={() => handleOpenPreview(embedSettings.toeflSections.reading.url, 'Preview Reading')} className="btn btn-ghost btn-sm">
                          <Eye size={13} /> Preview
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={embedSettings.toeflSections.reading.url}
                        onChange={(e) =>
                          setEmbedSettings({
                            ...embedSettings,
                            toeflSections: {
                              ...embedSettings.toeflSections,
                              reading: { ...embedSettings.toeflSections.reading, url: e.target.value },
                            },
                          })
                        }
                        required
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <div>
                        <label className="form-label">Durasi (Menit)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={embedSettings.toeflSections.reading.minutes}
                          onChange={(e) =>
                            setEmbedSettings({
                              ...embedSettings,
                              toeflSections: {
                                ...embedSettings.toeflSections,
                                reading: { ...embedSettings.toeflSections.reading, minutes: Number(e.target.value) },
                              },
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      Simpan Pengaturan TOEFL
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TPA EMBEDS */}
            {adminSidebarMenu === 'tpa_embeds' && (
              <div style={{ maxWidth: '640px' }}>
                <div className="clean-card">
                  <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Pengaturan Link Form TPA</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
                    Sematkan Google Form untuk Tes Potensi Akademik
                  </p>

                  <form onSubmit={handleSaveEmbedSettings}>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Link Google Form TPA *</label>
                        <button type="button" onClick={() => handleOpenPreview(embedSettings.tpa.url, 'Preview TPA')} className="btn btn-ghost btn-sm">
                          <Eye size={13} /> Preview
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={embedSettings.tpa.url}
                        onChange={(e) =>
                          setEmbedSettings({
                            ...embedSettings,
                            tpa: { ...embedSettings.tpa, url: e.target.value },
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Durasi Ujian TPA (Menit)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={embedSettings.tpa.minutes}
                        onChange={(e) =>
                          setEmbedSettings({
                            ...embedSettings,
                            tpa: { ...embedSettings.tpa, minutes: Number(e.target.value) },
                          })
                        }
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      Simpan Pengaturan TPA
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* PARTICIPANTS */}
            {adminSidebarMenu === 'participants' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem' }}>Rekap Peserta Mahasiswa</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      Data mahasiswa yang telah menyelesaikan ujian
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
                      <Printer size={14} /> Cetak
                    </button>
                    <button onClick={handleExportParticipants} className="btn btn-emerald btn-sm">
                      <Download size={14} /> Download Excel/CSV
                    </button>
                  </div>
                </div>

                {/* Filter */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '2rem' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari Nama, NIM, Token..."
                    />
                  </div>

                  <select className="form-select" value={filterProdi} onChange={(e) => setFilterProdi(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">Semua Prodi</option>
                    <option value="Akuntansi">Akuntansi</option>
                    <option value="Manajemen">Manajemen</option>
                  </select>

                  <select className="form-select" value={filterExam} onChange={(e) => setFilterExam(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">Semua Ujian</option>
                    <option value="toefl">TOEFL Like</option>
                    <option value="tpa">TPA</option>
                  </select>

                  {participants.length > 0 && (
                    <button
                      onClick={() => {
                        void Swal.fire({
                          icon: 'warning',
                          title: 'Kosongkan data peserta?',
                          text: 'Seluruh data peserta akan dihapus dan tindakan ini tidak dapat dibatalkan.',
                          showCancelButton: true,
                          confirmButtonText: 'Ya, kosongkan',
                          cancelButtonText: 'Batal',
                          confirmButtonColor: '#dc2626',
                        }).then(({ isConfirmed }) => {
                          if (isConfirmed) {
                            StorageService.clearParticipants();
                            SupabaseService.clearParticipants();
                            setParticipants([]);
                          }
                        });
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={13} /> Kosongkan
                    </button>
                  )}
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>NIM</th>
                        <th>Prodi</th>
                        <th>Ujian</th>
                        <th>Token</th>
                        <th>Mulai</th>
                        <th>Selesai</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            Belum ada data peserta.
                          </td>
                        </tr>
                      ) : (
                        filteredParticipants.map((p, idx) => (
                          <tr key={p.id}>
                            <td>{idx + 1}</td>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.nim}</td>
                            <td>{p.prodi}</td>
                            <td>{p.examType.toUpperCase()}</td>
                            <td><code>{p.tokenCode}</code></td>
                            <td>{new Date(p.startedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>{p.completedAt ? new Date(p.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td>
                              <span className={`badge ${p.status === 'completed' ? 'badge-active' : 'badge-inactive'}`}>
                                {p.status === 'completed' ? 'Selesai' : 'Ujian'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* MODAL TOKEN */}
      {isTokenModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTokenModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>{editingToken ? 'Edit Token' : 'Buat Token Baru'}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsTokenModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveToken}>
              <div className="form-group">
                <label className="form-label">Kode Token *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={tokenFormData.code}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, code: e.target.value.toUpperCase() })}
                    placeholder="TOEFL-2025"
                    required
                    style={{ fontFamily: 'monospace', fontWeight: 600 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const prefix = tokenFormData.examType === 'tpa' ? 'TPA' : 'TOEFL';
                      setTokenFormData({
                        ...tokenFormData,
                        code: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
                      });
                    }}
                  >
                    Acak
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Sesi / Jadwal</label>
                <input
                  type="text"
                  className="form-input"
                  value={tokenFormData.name}
                  onChange={(e) => setTokenFormData({ ...tokenFormData, name: e.target.value })}
                  placeholder="Sesi Ujian Pagi"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Jenis Ujian</label>
                <select
                  className="form-select"
                  value={tokenFormData.examType}
                  onChange={(e) => setTokenFormData({ ...tokenFormData, examType: e.target.value as ExamType })}
                >
                  <option value="toefl">Hari 1: TOEFL Like (3 Seksi)</option>
                  <option value="tpa">Hari 2: TPA</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={tokenFormData.isActive}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, isActive: e.target.checked })}
                  />
                  <span className="slider"></span>
                </label>
                <span style={{ fontSize: '0.85rem' }}>Status: {tokenFormData.isActive ? 'Aktif' : 'Non-Aktif'}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTokenModalOpen(false)} style={{ flex: 1 }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW */}
      {isPreviewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPreviewModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '900px', height: '85vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem' }}>{previewTitle}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsPreviewModalOpen(false)}>
                ✕
              </button>
            </div>
            <div style={{ flex: 1, width: '100%', background: '#ffffff', overflow: 'hidden' }}>
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Preview"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL FINISH */}
      {isFinishConfirmModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Konfirmasi Selesai Ujian</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Pastikan Anda sudah menekan tombol <strong>KIRIM (SUBMIT)</strong> di dalam formulir Google Form sebelum menyelesaikan sesi ini.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFinishConfirmModalOpen(false)} style={{ flex: 1 }}>
                Kembali
              </button>
              <button type="button" className="btn btn-emerald" onClick={handleConfirmFinishExam} style={{ flex: 1 }}>
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
