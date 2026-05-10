import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  BarChart3, 
  Info, 
  Sigma, 
  TrendingUp, 
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  Users,
  LogOut,
  GraduationCap,
  Save,
  CheckCircle2,
  XCircle,
  Trophy,
  History,
  Lock
} from 'lucide-react';
// Removed framer-motion for debugging
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Label
} from 'recharts';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  where,
  limit
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { FrequencyRow, StudentProfile, Submission } from './types';

// Constants
const ADMIN_EMAIL = 'abujihadasfour@gmail.com';

// Header Component
const Header = ({ setView, view, profile, user, logout, login, darkMode, toggleDarkMode }: any) => (
  <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-500/20">
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-blue-600 dark:text-blue-400 text-right">إحصاء بلس</h1>
          <p className="text-[10px] text-slate-400 font-bold -mt-1 uppercase tracking-widest hidden sm:block text-right">Math Dept - HBTS</p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        <NavBtn active={view === 'calc'} onClick={() => setView('calc')} icon={<Calculator size={18} />} label="الحاسبة الإحصائية" />
        <NavBtn active={view === 'test'} onClick={() => setView('test')} icon={<BookOpen size={18} />} label="اختبار ذاتي" />
        <NavBtn active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<TrendingUp size={18} />} label="نتائجي" />
        {(profile?.role === 'teacher' || user?.email === ADMIN_EMAIL) && (
          <NavBtn active={view === 'admin'} onClick={() => setView('admin')} icon={<Users size={18} />} label="لوحة المعلم" color="text-emerald-600" />
        )}
      </nav>

      <div className="flex items-center gap-3">
        <button onClick={toggleDarkMode} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
          {darkMode ? <Plus size={20} className="rotate-45 text-yellow-400" /> : <Sigma size={20} className="text-slate-600" />}
        </button>
        {user ? (
          <div className="flex items-center gap-3 pr-3 border-r border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none">{profile?.name || user.displayName || 'طالب'}</p>
              <p className="text-[10px] text-slate-500">{profile?.grade || ''}</p>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button onClick={login} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
            دخول الطلاب
          </button>
        )}
      </div>
    </div>
  </header>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'calc' | 'test' | 'dashboard' | 'admin'>('home');
  const [darkMode, setDarkMode] = useState(false);

  // Auth State
  useEffect(() => {
    console.log("App mounted, auth:", auth);
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log("Auth state changed:", u?.uid);
      try {
        setUser(u);
        if (u) {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             console.log("Profile found:", docSnap.data());
            setProfile(docSnap.data() as StudentProfile);
          } else {
             console.log("No profile found for user:", u.uid);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
       console.error("Auth observer error:", error);
       setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => signOut(auth);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-blue-600">
        <div className="animate-spin mb-4">
          <Calculator size={48} />
        </div>
        <p className="font-bold text-slate-500">جاري تحميل المنصة...</p>
      </div>
    );
  }

  // If logged in but no profile, show setup
  if (user && !profile) {
    return <SetupProfile user={user} onComplete={setProfile} />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans`}>
      <Header 
        setView={setView} 
        view={view} 
        profile={profile} 
        user={user} 
        logout={logout} 
        login={login} 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div>
          {view === 'home' && <HomeView setView={setView} user={user} login={login} />}
          {view === 'calc' && <StatsView mode="calculator" />}
          {view === 'test' && <StatsView mode="test" profile={profile} user={user} />}
          {view === 'dashboard' && <StudentDashboard user={user} />}
          {view === 'admin' && <AdminDashboard />}
        </div>
      </main>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex flex-col items-center">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">المراجعة النهائية لوحدة الإحصاء</h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm">قسم الرياضيات - مدرسة حسان بن ثابت الثانوية للبنين</p>
          </div>
          <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full" />
          <p className="text-xs text-slate-400 uppercase font-black tracking-widest">© 2026 Developed for Excellence</p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-Views ---

function NavBtn({ active, onClick, icon, label, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-sm ${
        active 
        ? (color || "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400") 
        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SetupProfile({ user, onComplete }: { user: User, onComplete: (p: StudentProfile) => void }) {
  const [name, setName] = useState(user.displayName || '');
  const [grade, setGrade] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name || !grade) return;
    setSaving(true);
    try {
      const p: StudentProfile = {
        name,
        grade,
        role: 'student',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), p);
      onComplete(p);
    } catch (e) {
      console.error("Setup Error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 scale-150 rotate-12 opacity-5 text-blue-600">
           <GraduationCap size={160} />
        </div>
        
        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
            <Users size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">إكمال الملف الشخصي</h2>
            <p className="text-slate-500 text-sm mt-1">يرجى إدخال بياناتك للمتابعة</p>
          </div>

          <div className="space-y-4 text-right">
            <div>
              <label className="text-xs font-bold text-slate-400 mr-1 mb-1 block">الاسم الكامل</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                placeholder="أدخل اسمك..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mr-1 mb-1 block">الصف / الشعبة</label>
              <input 
                type="text" 
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full px-4 py-3 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                placeholder="مثال: الثاني عشر علمي 1"
              />
            </div>
          </div>

          <button 
            onClick={save}
            disabled={saving}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={20} />}
            <span>حفظ البيانات والبدء</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeView({ setView, user, login }: { setView: (v: any) => void, user: any, login: () => void | Promise<void> }) {
  return (
    <div className="space-y-12">
      <section className="relative h-[480px] rounded-3xl overflow-hidden bg-slate-900 text-white flex items-center px-12">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-blue-600/40" />
        <div className="relative z-10 max-w-2xl space-y-6 text-right ml-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold ring-1 ring-white/20 backdrop-blur-sm">
            <span>منصة الإحصاء المعتمدة - 2026</span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-5xl md:text-7xl font-black leading-tight text-right">عالم الإحـصاء <br/><span className="text-blue-400">بين يديك</span></h2>
          <p className="text-lg opacity-80 leading-relaxed max-w-lg text-right">
            منصة مدرسة حسان بن ثابت الثانوية (قسم الرياضيات) لتحليل البيانات، حساب الوسيط والمنوال، والتحقق من الحلول ذاتياً باحترافية عالية.
          </p>
          <div className="flex flex-wrap gap-4 pt-4 justify-end">
            {user ? (
              <button 
                onClick={() => setView('calc')}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-2xl shadow-blue-500/40 transition-all flex items-center gap-2"
              >
                <Calculator size={20} />
                <span>ابدأ الدراسة الآن</span>
              </button>
            ) : (
              <button 
                onClick={login}
                className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold shadow-2xl shadow-white/10 hover:bg-slate-100 transition-all"
              >
                تسجيل الدخول للمتابعة
              </button>
            )}
            <button 
               onClick={() => setView('test')}
               className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold ring-1 ring-white/10 transition-all"
            >
              الاختبار الذاتي
            </button>
          </div>
        </div>
        <div className="absolute left-0 bottom-0 opacity-10 pointer-events-none scale-150 transform -translate-x-20">
          <BarChart3 size={300} />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
        <FeatureCard 
          icon={<Calculator className="text-blue-500" />}
          title="حسابات دقيقة"
          desc="خوارزميات متطورة لحساب الوسط والوسيط والمنوال للبيانات المبوبة باختلاف المناهج."
        />
        <FeatureCard 
          icon={<BookOpen className="text-emerald-500" />}
          title="تعلم تفاعلي"
          desc="اختبارات ذاتية مع تصحيح فوري لمساعدتك على إتقان مهارات الحل الرياضي بدون رموز معقدة."
        />
        <FeatureCard 
          icon={<Users className="text-purple-500" />}
          title="متابعة المعلم"
          desc="نظام متكامل يتيح للمعلمين متابعة تقدم الطلاب وتحليل نتائجهم بدقة ومصداقية."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-card p-8 space-y-4 hover:border-blue-500/50 transition-all cursor-default group">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-xl font-black text-right">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed text-right">{desc}</p>
    </div>
  );
}

// --- LOGIC VIEW ---

function StatsView({ mode, profile, user }: { mode: 'calculator' | 'test', profile?: StudentProfile | null, user?: User | null, key?: string }) {
  const [rows, setRows] = useState<FrequencyRow[]>([
    { id: '1', lower: 0, upper: 10, freq: 4 },
    { id: '2', lower: 10, upper: 20, freq: 10 },
    { id: '3', lower: 20, upper: 30, freq: 16 },
    { id: '4', lower: 30, upper: 40, freq: 8 },
    { id: '5', lower: 40, upper: 50, freq: 2 },
  ]);

  const [isCalculated, setIsCalculated] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Student inputs for test mode
  const [studentInputs, setStudentInputs] = useState<any>({
    mean: '',
    median: '',
    variance: ''
  });

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    const diff = lastRow.upper - lastRow.lower;
    setRows([...rows, { 
      id: Date.now().toString(), 
      lower: lastRow.upper, 
      upper: lastRow.upper + diff, 
      freq: 0 
    }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof FrequencyRow, value: string) => {
    const val = parseInt(value) || 0;
    setRows(rows.map(row => row.id === id ? { ...row, [field]: val } : row));
  };

  const results = useMemo(() => {
    const sumFreq = rows.reduce((sum, r) => sum + r.freq, 0);
    const processedRows = rows.map(r => ({
      ...r,
      mid: (r.lower + r.upper) / 2,
    }));

    const sumFX = processedRows.reduce((sum, r) => sum + (r.freq * r.mid), 0);
    const mean = sumFreq > 0 ? sumFX / sumFreq : 0;

    // Variance using (x - mean)^2
    const sumF_Diff_Sq = processedRows.reduce((sum, r) => 
      sum + (r.freq * Math.pow(r.mid - mean, 2))
    , 0);
    
    const variance = sumFreq > 0 ? sumF_Diff_Sq / sumFreq : 0;
    const stdDev = Math.sqrt(variance);

    // Median
    let currentCumFreq = 0;
    const medianTarget = sumFreq / 2;
    const cumRows = processedRows.map(r => {
      currentCumFreq += r.freq;
      return { ...r, cumFreq: currentCumFreq };
    });

    const medianClassIdx = cumRows.findIndex(r => r.cumFreq >= medianTarget);
    let median = 0;
    let interpolationPoints = { f1: 0, f2: 0, l1: 0, l2: 0, target: 0 };

    if (medianClassIdx !== -1 && sumFreq > 0) {
      const cls = cumRows[medianClassIdx];
      const prevCum = medianClassIdx > 0 ? cumRows[medianClassIdx - 1].cumFreq : 0;
      const h = cls.upper - cls.lower;
      median = cls.lower + ((medianTarget - prevCum) / cls.freq) * h;
      
      interpolationPoints = {
        f1: prevCum,
        f2: cls.cumFreq,
        l1: cls.lower,
        l2: cls.upper,
        target: medianTarget
      };
    }

    return { 
      processedRows, sumFreq, sumFX, mean, 
      cumRows, median, medianClassIdx,
      variance, stdDev, sumF_Diff_Sq, interpolationPoints,
      chartData: [{ name: rows[0].lower, value: 0 }, ...cumRows.map(r => ({ name: r.upper, value: r.cumFreq }))]
    };
  }, [rows]);

  const checkSolution = async () => {
    const isMedianCorrect = Math.abs(parseFloat(studentInputs.median) - results.median) < 0.1;
    const isMeanCorrect = Math.abs(parseFloat(studentInputs.mean) - results.mean) < 0.1;
    
    let score = 0;
    if (isMedianCorrect) score += 50;
    if (isMeanCorrect) score += 50;

    setFeedback({
      isMedianCorrect,
      isMeanCorrect,
      score
    });

    if (user && profile) {
      setSaving(true);
      const sub: Submission = {
        studentId: user.uid,
        studentName: profile.name,
        grade: profile.grade,
        score,
        details: {
          isMeanCorrect,
          isMedianCorrect
        },
        data: { rows, results },
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'submissions'), sub);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-right">{mode === 'calculator' ? 'الحاسبة الإحصائية' : 'اختبار المهارات الإحصائية'}</h2>
          <p className="text-slate-500 text-right">{mode === 'calculator' ? 'حل الجداول التكرارية بضغطة زر' : 'قم بحل الجدول يدوياً ثم قارن نتيجتك'}</p>
        </div>
        <div className="flex gap-2 justify-end">
           <button onClick={() => setRows([{ id: '1', lower: 0, upper: 10, freq: 0 }])} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"><History size={20} /></button>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-card p-6 overflow-hidden">
        <h3 className="text-lg font-bold mb-6 flex items-center justify-end gap-2 text-right">
          <GraduationCap className="text-blue-500" size={22} />
          إدخل البيانات للفئات
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="pb-4 pr-2 font-bold text-sm text-slate-500">الفئة (X)</th>
                <th className="pb-4 px-4 font-bold text-sm text-slate-500">التكرار (f)</th>
                <th className="pb-4 pl-2 font-bold text-sm text-slate-500 w-16">إدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2">
                       <input 
                        type="number" 
                        value={row.lower}
                        onChange={(e) => updateRow(row.id, 'lower', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-center font-bold"
                      />
                      <span className="text-slate-400">←</span>
                      <input 
                        type="number" 
                        value={row.upper}
                        onChange={(e) => updateRow(row.id, 'upper', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-center font-bold"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input 
                      type="number" 
                      value={row.freq}
                      onChange={(e) => updateRow(row.id, 'freq', e.target.value)}
                      className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 focus:ring-2 focus:ring-blue-500 transition-all text-center font-black text-blue-600"
                    />
                  </td>
                  <td className="py-3 pl-2 text-center text-left">
                    <button onClick={() => removeRow(row.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <button onClick={addRow} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all font-bold">
            <Plus size={18} />
            <span>إضافة فئة</span>
          </button>
          <button 
            onClick={() => { setIsCalculated(true); setFeedback(null); }} 
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-500/20"
          >
            <Calculator size={18} />
            {mode === 'calculator' ? 'بدء العمليات الإحصائية' : 'تجهيز بيانات الاختبار'}
          </button>
        </div>
      </div>

        {isCalculated && (
          <div className="space-y-12">
            
            {/* Calculation: Mean */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center justify-end gap-2 text-right">
                جدول الوسط الحسابي
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">Σ</div>
              </h3>
              <div className="glass-card overflow-hidden">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-right">الفئة</th>
                      <th className="px-4 py-3 text-right">f</th>
                      <th className="px-4 py-3 text-right">x (المركز)</th>
                      <th className="px-4 py-3 text-right">f × x</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.processedRows.map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold text-right">{r.lower} - {r.upper}</td>
                        <td className="px-4 py-3 text-right">{r.freq}</td>
                        <td className="px-4 py-3 text-right">{r.mid}</td>
                        <td className="px-4 py-3 bg-blue-50/20 text-right">{r.freq * r.mid}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-600 text-white font-bold">
                      <td className="px-4 py-3 text-center">المجموع</td>
                      <td className="px-4 py-3 text-right">{results.sumFreq}</td>
                      <td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3 text-right">{results.sumFX}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="font-serif text-lg">Mean (x̄) = Σ(f · x) / Σf = {results.sumFX} / {results.sumFreq}</div>
                 <div className="text-3xl font-black text-blue-400">{results.mean.toFixed(2)}</div>
              </div>
            </section>

            {/* Calculation: Median with Interpolation Arrows */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center justify-end gap-2 text-right">
                إيجاد الوسيط بطريقة التناسب
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">M</div>
              </h3>
              <div className="glass-card p-6">
                <div className="max-w-md mx-auto grid grid-cols-3 gap-y-4 items-center mb-8">
                  <div className="text-xs font-bold text-slate-400 pb-2 text-right">التكرار التراكمي</div>
                  <div className="h-0" />
                  <div className="text-xs font-bold text-slate-400 pb-2 text-left">الحدود العليا</div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center font-bold">{results.interpolationPoints.f1}</div>
                  <div className="text-center text-slate-300">──────</div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center font-bold">{results.interpolationPoints.l1}</div>

                  <div className="relative">
                    <div className="p-3 bg-emerald-600 text-white rounded-lg text-center font-bold shadow-lg z-10 relative">{results.interpolationPoints.target.toFixed(1)}</div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-4 w-px border-l border-dashed border-emerald-400" />
                  </div>
                  <div className="flex justify-center">
                    <TrendingUp className="text-emerald-500 animate-spin-slow" size={24} />
                  </div>
                  <div className="relative">
                    <div className="p-3 bg-blue-600 text-white rounded-lg text-center font-bold shadow-lg z-10 relative">???</div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-4 w-px border-l border-dashed border-blue-400" />
                  </div>

                  <div className="relative">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center font-bold">{results.interpolationPoints.f2}</div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-4 w-px border-l border-dashed border-slate-300" />
                  </div>
                  <div className="text-center text-slate-300">──────</div>
                  <div className="relative">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center font-bold">{results.interpolationPoints.l2}</div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-4 w-px border-l border-dashed border-slate-300" />
                  </div>
                </div>

                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-center font-serif text-xl leading-loose mb-4" dir="ltr">
                    (M - L₁) / (L₂ - L₁) = ((Σf/2) - F₁) / (F₂ - F₁)
                  </p>
                  <p className="text-center text-sm font-bold text-slate-600 dark:text-slate-400">
                    الوسيط = {results.median.toFixed(2)}
                  </p>
                </div>
              </div>
            </section>

            {/* Calculation: Variance with Deviation Table */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center justify-end gap-2 text-right">
                حساب التباين والانحراف المعياري
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-md">S²</div>
              </h3>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-right">مركز الفئة (x)</th>
                        <th className="px-4 py-3 text-right">x - x̄</th>
                        <th className="px-4 py-3 text-right">(x - x̄)²</th>
                        <th className="px-4 py-3 text-right">f</th>
                        <th className="px-4 py-3 text-right">f · (x - x̄)²</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {results.processedRows.map((r, i) => {
                        const dev = r.mid - results.mean;
                        const devSq = Math.pow(dev, 2);
                        return (
                          <tr key={i}>
                            <td className="px-4 py-3 font-bold text-right">{r.mid}</td>
                            <td className="px-4 py-3 font-mono text-right">{dev.toFixed(2)}</td>
                            <td className="px-4 py-3 font-mono text-right">{devSq.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">{r.freq}</td>
                            <td className="px-4 py-3 bg-orange-50/30 text-right">{(r.freq * devSq).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-orange-600 text-white font-bold">
                        <td className="px-4 py-3 text-center" colSpan={3}>المجموع (Σ)</td>
                        <td className="px-4 py-3 text-right">{results.sumFreq}</td>
                        <td className="px-4 py-3 text-right">{results.sumF_Diff_Sq.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-right">
                  <p className="text-xs text-slate-400 font-bold mb-2">Variance Formulation:</p>
                  <p className="font-serif text-lg" dir="ltr">S² = Σ ( f · (x - x̄)² ) / Σf</p>
                  <p className="text-2xl font-black mt-2 text-orange-600">{results.variance.toFixed(2)}</p>
                </div>
                <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col justify-center text-right">
                  <p className="text-xs text-blue-400 font-bold mb-2">Standard Deviation:</p>
                  <div className="flex items-center justify-between">
                    <Sigma size={32} className="opacity-20" />
                    <p className="text-3xl font-black">S = {results.stdDev.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Ogive Chart with Visual Median */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center justify-end gap-2 text-right">
                المنحنى التكراري التراكمي
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md">
                   <BarChart3 size={16} />
                </div>
              </h3>
              <div className="glass-card p-6">
                <div className="h-[350px] md:h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorOgive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="1 1" stroke="#cbd5e1" />
                      <XAxis dataKey="name" type="number" domain={['auto', 'auto']} tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      
                      <ReferenceLine y={results.sumFreq / 2} stroke="#10b981" strokeDasharray="3 3">
                        <Label value="Median Pos" position="right" fill="#10b981" fontSize={10} />
                      </ReferenceLine>
                      <ReferenceLine x={results.median} stroke="#10b981" strokeDasharray="3 3">
                        <Label value={`M = ${results.median.toFixed(1)}`} position="top" fill="#10b981" fontSize={10} />
                      </ReferenceLine>

                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={4}
                        fill="url(#colorOgive)"
                        dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Test Area if mode === 'test' */}
            {mode === 'test' && (
              <section className="p-8 border-4 border-dashed border-blue-200 dark:border-blue-900 rounded-[40px] space-y-8">
                 <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-blue-600">منطقة اختبار الطالب</h2>
                    <p className="text-slate-500 font-bold italic">قم بمعالجة الأرقام السابقة وأدخل إجاباتك هنا للتحقق</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                    <div className="space-y-4">
                       <label className="font-bold text-sm block">الوسط الحسابي المحسوب:</label>
                       <input 
                         type="number" 
                         step="0.01"
                         onChange={e => setStudentInputs({...studentInputs, mean: e.target.value})}
                         className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-bold text-center"
                         placeholder="أدخل نتيجتك..."
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="font-bold text-sm block">الوسيط المحسوب (بالتناسب):</label>
                       <input 
                         type="number" 
                         step="0.01"
                         onChange={e => setStudentInputs({...studentInputs, median: e.target.value})}
                         className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-bold text-center"
                         placeholder="أدخل نتيجتك..."
                       />
                    </div>
                 </div>

                 <button 
                   onClick={checkSolution}
                   disabled={saving}
                   className="w-full py-6 bg-emerald-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                 >
                   {saving ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={24} />}
                   <span>تحقق من الحل وإرسال النتيجة</span>
                 </button>

                 {feedback && (
                   <div className={`p-10 rounded-[32px] text-center space-y-6 ${feedback.score === 100 ? 'bg-emerald-500 text-white shadow-emerald-500/40 shadow-2xl' : 'bg-red-500 text-white shadow-red-500/40 shadow-2xl'}`}>
                     <div className="flex items-center justify-center gap-4">
                        <h4 className="text-4xl font-black">الدرجة: {feedback.score}%</h4>
                        {feedback.score === 100 ? <Trophy size={60} /> : <XCircle size={60} />}
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl bg-white/10 ${feedback.isMedianCorrect ? 'border-none' : 'ring-2 ring-white/50'}`}>
                           الوسيط {feedback.isMedianCorrect ? '✅' : '❌'}
                        </div>
                        <div className={`p-4 rounded-2xl bg-white/10 ${feedback.isMeanCorrect ? 'border-none' : 'ring-2 ring-white/50'}`}>
                           الوسط {feedback.isMeanCorrect ? '✅' : '❌'}
                        </div>
                     </div>
                     <p className="font-bold flex items-center justify-center gap-2">
                        {feedback.score === 100 ? 'عمل جبار! أنت مبدع في الرياضيات' : 'راجع الحلول في الأعلى جيداً لتعرف أين الخطأ'}
                     </p>
                   </div>
                 )}
              </section>
            )}

          </div>
        )}
    </div>
  );
}

// --- DASHBOARDS ---

function StudentDashboard({ user }: { user: any, key?: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const q = query(collection(db, 'submissions'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setSubmissions(snap.docs.map(d => ({ ...d.data(), id: d.id }) as Submission));
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end gap-3 text-right">
        <div>
          <h2 className="text-3xl font-black">سجل الاختبارات</h2>
          <p className="text-slate-500">تاريخ حلولك ودرجاتك في المنصة</p>
        </div>
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
          <History size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((sub, i) => (
          <div key={i} className="glass-card p-6 space-y-4 relative overflow-hidden text-right">
            <div className={`absolute top-0 right-0 w-2 h-full ${sub.score === 100 ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div className="flex justify-between items-start">
               <div className={`text-2xl font-black ${sub.score === 100 ? 'text-emerald-500' : 'text-red-500'}`}>%{sub.score}</div>
               <div className="text-xs text-slate-400 font-bold uppercase">{new Date(sub.createdAt?.toDate()).toLocaleDateString('ar-EG')}</div>
            </div>
            <div className="space-y-1">
               <p className="text-sm font-bold text-slate-600 dark:text-slate-400">الاختبار #{submissions.length - i}</p>
               <p className="text-xs text-slate-400 italic">تم الحل بنجاح</p>
            </div>
          </div>
        ))}
        {submissions.length === 0 && !loading && <div className="col-span-full py-20 text-center opacity-30 font-bold">لم تقم بأي اختبارات بعد</div>}
      </div>
    </div>
  );
}

function AdminDashboard({ key }: { key?: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'submissions' | 'students'>('submissions');

  useEffect(() => {
    const loadData = async () => {
      try {
        const subQ = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
        const subSnap = await getDocs(subQ);
        const subList = subSnap.docs.map(d => ({ ...d.data(), id: d.id }) as Submission);
        setSubmissions(subList);

        const userQ = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('name', 'asc'));
        const userSnap = await getDocs(userQ);
        const userList = userSnap.docs.map(d => d.data() as StudentProfile);
        setStudents(userList);
      } catch (err) {
        console.error("Admin Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    if (submissions.length === 0) return { avg: "0", total: 0, perfect: 0, meanSuccess: "0", medianSuccess: "0", studentsCount: students.length };
    
    const sum = submissions.reduce((acc, s) => acc + s.score, 0);
    const avg = sum / submissions.length;
    const perfect = submissions.filter(s => s.score === 100).length;
    
    // Detailed analysis
    const meanCount = submissions.filter(s => s.details?.isMeanCorrect).length;
    const medianCount = submissions.filter(s => s.details?.isMedianCorrect).length;
    
    return {
      avg: avg.toFixed(1),
      total: submissions.length,
      perfect,
      meanSuccess: ((meanCount / submissions.length) * 100).toFixed(0),
      medianSuccess: ((medianCount / submissions.length) * 100).toFixed(0),
      studentsCount: students.length
    };
  }, [submissions, students]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [submissions, searchTerm]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const distributionData = useMemo(() => {
    const dist = [0, 50, 100].map(score => ({
      score: `${score}%`,
      count: submissions.filter(s => s.score === score).length
    }));
    return dist;
  }, [submissions]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-right">
        <div>
          <h2 className="text-3xl font-black text-emerald-600">لوحة المعلم والتحليل</h2>
          <p className="text-slate-500">متابعة دقيقة لأداء الطلاب ونتائج الاختبارات الذاتية</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-6 py-3 flex items-center gap-3">
             <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">طلاب مسجلون</p>
                <p className="text-xl font-black">{stats.studentsCount}</p>
             </div>
             <Users className="text-emerald-500" size={24} />
          </div>
          <div className="glass-card px-6 py-3 flex items-center gap-3">
             <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">متوسط المنصة</p>
                <p className="text-xl font-black text-blue-600">%{stats.avg}</p>
             </div>
             <TrendingUp className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Analysis Column */}
        <div className="space-y-6 text-right">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center justify-end gap-2 text-right">
              تحليل المفاهيم
              <BarChart3 size={18} className="text-emerald-500" />
            </h3>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                     <span className="text-emerald-600">%{stats.meanSuccess}</span>
                     <span>الوسط الحسابي</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stats.meanSuccess}%` }} />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                     <span className="text-blue-600">%{stats.medianSuccess}</span>
                     <span>الوسيط (التناسب)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${stats.medianSuccess}%` }} />
                  </div>
               </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
             <h3 className="font-bold text-right text-sm">توزيع الدرجات</h3>
             <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={distributionData}>
                    <Area type="monotone" dataKey="count" fill="#10b981" stroke="#059669" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* List Content */}
        <div className="lg:col-span-3 space-y-4 text-right">
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                <button 
                  onClick={() => setActiveTab('submissions')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'submissions' ? 'bg-white dark:bg-slate-700 shadow-sm shadow-black/5 text-slate-900 dark:text-white' : 'text-slate-400'}`}
                >
                  جميع المحاولات
                </button>
                <button 
                  onClick={() => setActiveTab('students')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'students' ? 'bg-white dark:bg-slate-700 shadow-sm shadow-black/5 text-slate-900 dark:text-white' : 'text-slate-400'}`}
                >
                  قائمة الطلاب
                </button>
             </div>
             
             <div className="flex-1 flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                <input 
                  type="text" 
                  placeholder={activeTab === 'submissions' ? "ابحث في المحاولات..." : "ابحث في الطلاب..."}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-right font-bold text-sm"
                />
                <History size={18} className="text-slate-400" />
             </div>
          </div>

          <div className="glass-card overflow-hidden">
            {activeTab === 'submissions' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4">الطالب</th>
                      <th className="px-6 py-4">الصف</th>
                      <th className="px-6 py-4">النتيجة</th>
                      <th className="px-6 py-4 text-left">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-bold">{sub.studentName}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{sub.grade}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                             sub.score === 100 ? 'bg-emerald-100 text-emerald-600' : 
                             sub.score === 50 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                           }`}>
                             %{sub.score}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 uppercase font-bold text-left">
                          {sub.createdAt?.toDate().toLocaleDateString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4">اسم الطالب</th>
                      <th className="px-6 py-4 text-right">الصف</th>
                      <th className="px-6 py-4 text-left">تاريخ التسجيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-bold">{st.name}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 text-right">{st.grade}</td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 text-left">
                          {st.createdAt?.toDate().toLocaleDateString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {(activeTab === 'submissions' ? filteredSubmissions : filteredStudents).length === 0 && !loading && (
              <div className="py-20 text-center opacity-30 font-bold italic">لا توجد بيانات</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
