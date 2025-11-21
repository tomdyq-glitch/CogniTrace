import React, { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, Sparkles, BarChart3, Layout } from 'lucide-react';
import { Subject, SkillState, Question, KTModelConfig, GlobalStepLog } from './types';
import { generateAdaptiveQuestion } from './services/geminiService';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { KnowledgeHeatmap } from './components/KnowledgeHeatmap';
import { QuestionCard } from './components/QuestionCard';

// --- Simplified KT Constants ---
const INITIAL_MASTERY = 0.15; // Start lower to visualize progress better
const KT_CONFIG: KTModelConfig = {
  learnRate: 0.20, // 学习率
  slipRate: 0.1,   // 失误率
  guessRate: 0.15,  // 猜对率
};

const App: React.FC = () => {
  // --- State ---
  const [skills, setSkills] = useState<Record<string, SkillState>>({
    [Subject.ARITHMETIC]: { subject: Subject.ARITHMETIC, masteryLevel: INITIAL_MASTERY, confidence: 0.5, history: [{ timestamp: Date.now(), value: INITIAL_MASTERY }] },
    [Subject.FRACTIONS]: { subject: Subject.FRACTIONS, masteryLevel: INITIAL_MASTERY, confidence: 0.5, history: [{ timestamp: Date.now(), value: INITIAL_MASTERY }] },
    [Subject.ALGEBRA]: { subject: Subject.ALGEBRA, masteryLevel: INITIAL_MASTERY, confidence: 0.5, history: [{ timestamp: Date.now(), value: INITIAL_MASTERY }] },
    [Subject.GEOMETRY]: { subject: Subject.GEOMETRY, masteryLevel: INITIAL_MASTERY, confidence: 0.5, history: [{ timestamp: Date.now(), value: INITIAL_MASTERY }] },
    [Subject.PROBABILITY]: { subject: Subject.PROBABILITY, masteryLevel: INITIAL_MASTERY, confidence: 0.5, history: [{ timestamp: Date.now(), value: INITIAL_MASTERY }] },
  });

  // Global log to render the heatmap properly (snapshots of all skills at each step)
  const [globalHistory, setGlobalHistory] = useState<GlobalStepLog[]>([]);

  const [activeSubject, setActiveSubject] = useState<Subject>(Subject.ARITHMETIC);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [sessionLog, setSessionLog] = useState<{ result: '正确' | '错误', delta: number, subject: Subject }[]>([]);

  // --- Knowledge Tracing Logic (The "Brain") ---
  const updateMastery = (subject: Subject, isCorrect: boolean) => {
    setSkills(prev => {
      const currentSkill = prev[subject];
      const pOld = currentSkill.masteryLevel;
      let pNew = pOld;

      // Simplified Bayesian Update (BKT)
      if (isCorrect) {
        const pLearn = (pOld * (1 - KT_CONFIG.slipRate)) / 
                       (pOld * (1 - KT_CONFIG.slipRate) + (1 - pOld) * KT_CONFIG.guessRate);
        pNew = pLearn + (1 - pLearn) * KT_CONFIG.learnRate;
      } else {
        const pLearn = (pOld * KT_CONFIG.slipRate) / 
                       (pOld * KT_CONFIG.slipRate + (1 - pOld) * (1 - KT_CONFIG.guessRate));
         pNew = pLearn + (1 - pLearn) * KT_CONFIG.learnRate;
      }

      // Clamp
      pNew = Math.min(0.99, Math.max(0.01, pNew));
      const delta = pNew - pOld;

      // Update log for sidebar
      setSessionLog(logs => [...logs, { result: isCorrect ? '正确' : '错误', delta, subject }]);

      const newSkills = {
        ...prev,
        [subject]: {
          ...currentSkill,
          masteryLevel: pNew,
          history: [...currentSkill.history, { timestamp: Date.now(), value: pNew }]
        }
      };

      // Create a snapshot of ALL skills for the heatmap
      // Note: newSkills has the updated subject, others remain same
      const currentSnapshot: Record<Subject, number> = {} as Record<Subject, number>;
      Object.values(newSkills).forEach((s: SkillState) => {
        currentSnapshot[s.subject] = s.masteryLevel;
      });

      setGlobalHistory(hist => [...hist, {
        stepIndex: hist.length,
        activeSubject: subject,
        isCorrect: isCorrect,
        masterySnapshot: currentSnapshot
      }]);

      return newSkills;
    });
  };

  // --- Adaptive Question Loading ---
  const loadNextQuestion = useCallback(async () => {
    setLoading(true);
    setSelectedAnswer(null);
    
    const currentMastery = skills[activeSubject].masteryLevel;
    let targetDifficulty = Math.ceil(currentMastery * 10);
    if (targetDifficulty < 1) targetDifficulty = 1;
    if (Math.random() > 0.3) targetDifficulty += 1;
    if (targetDifficulty > 10) targetDifficulty = 10;

    try {
      const question = await generateAdaptiveQuestion(activeSubject, currentMastery, targetDifficulty);
      setCurrentQuestion(question);
    } catch (error) {
      console.error("Failed to fetch question", error);
    } finally {
      setLoading(false);
    }
  }, [activeSubject, skills]);

  // Initial Load
  useEffect(() => {
    if (!currentQuestion) {
      loadNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject]);

  const handleAnswer = (index: number) => {
    if (!currentQuestion) return;
    setSelectedAnswer(index);
    const isCorrect = index === currentQuestion.correctIndex;
    updateMastery(activeSubject, isCorrect);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar / Control Panel */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex-shrink-0 overflow-y-auto h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <BrainCircuit size={28} />
            <h1 className="text-xl font-bold tracking-tight">CogniTrace</h1>
          </div>
          <p className="text-xs text-slate-500">知识追踪演示系统</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Subject Selector */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">学习科目</h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(Subject).map(subj => (
                <button
                  key={subj}
                  onClick={() => setActiveSubject(subj)}
                  className={`px-4 py-3 rounded-lg text-left text-sm font-medium transition-all ${
                    activeSubject === subj 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{subj}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      skills[subj].masteryLevel > 0.7 ? 'bg-green-100 text-green-700' :
                      skills[subj].masteryLevel > 0.4 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {Math.round(skills[subj].masteryLevel * 100)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Snippet */}
          <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-indigo-400" />
              <h3 className="text-sm font-medium">BKT 模型参数</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>当前难度</span>
                <span className="text-white">{currentQuestion?.difficulty || '-'}/10</span>
              </div>
              <div className="flex justify-between">
                <span>知识掌握度</span>
                <span className="text-green-400">{Math.round(skills[activeSubject].masteryLevel * 100)}%</span>
              </div>
              <div className="h-px bg-slate-700 my-2"></div>
               <div className="flex justify-between">
                <span>做题总数</span>
                <span className="text-white">{globalHistory.length}</span>
              </div>
            </div>
          </div>

           {/* Session Log Feed */}
           <div className="space-y-2">
               <h3 className="text-xs font-bold text-slate-400 uppercase">最近动态</h3>
               <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                  {sessionLog.length === 0 && <p className="text-xs text-slate-400 italic">暂无数据。</p>}
                  {[...sessionLog].reverse().map((log, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-medium mb-0.5">{log.subject}</span>
                        <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${log.result === '正确' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-slate-500">{log.result}</span>
                        </div>
                      </div>
                      <span className={`font-mono font-medium ${log.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.delta > 0 ? '+' : ''}{(log.delta * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
               </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Row: Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                <KnowledgeHeatmap logs={globalHistory} subjects={Object.values(Subject)} />
             </div>
             <div className="lg:col-span-1">
                <KnowledgeGraph skills={skills} />
             </div>
          </div>

          {/* Bottom Row: Question Interface */}
          <div className="">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Layout size={24} className="text-slate-400" />
                自适应测评区
              </h2>
            </div>

            {loading ? (
              <div className="w-full h-64 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center animate-pulse">
                <Sparkles className="text-indigo-400 mb-4 animate-spin-slow" size={32} />
                <p className="text-slate-500 font-medium">AI 正在分析知识盲区...</p>
              </div>
            ) : currentQuestion ? (
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                selectedAnswer={selectedAnswer}
                isSubmitting={false}
                onNext={loadNextQuestion}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                准备就绪
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;