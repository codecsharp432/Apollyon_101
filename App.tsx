import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TerminalButton, Panel, LoadingBar, TypewriterText } from './components/TerminalUI';
import { AppState, QuestionCount, Question, Answer, PersonalityReport, LeaderboardEntry } from './types';
import { generateAssessmentQuestions, analyzePersonality } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.BOOTING);
  const [username, setUsername] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [report, setReport] = useState<PersonalityReport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Track question timing
  const questionStartTime = useRef<number>(0);

  useEffect(() => {
    // Initial Boot Sequence
    const timer = setTimeout(() => {
      setState(AppState.AUTH);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load leaderboard
    const stored = localStorage.getItem('psyche7_leaderboard');
    if (stored) {
      setLeaderboard(JSON.parse(stored));
    } else {
      // Seed data
      const seed: LeaderboardEntry[] = [
        { id: '1', username: 'GHOST_01', score: 98, date: new Date().toISOString() },
        { id: '2', username: 'NEXUS', score: 92, date: new Date().toISOString() },
        { id: '3', username: 'CIPHER', score: 85, date: new Date().toISOString() },
      ];
      setLeaderboard(seed);
      localStorage.setItem('psyche7_leaderboard', JSON.stringify(seed));
    }
  }, []);
  
  // Reset timer when question changes or assessment starts
  useEffect(() => {
    if (state === AppState.ASSESSMENT) {
        questionStartTime.current = Date.now();
    }
  }, [currentQuestionIndex, state]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length > 2) {
      setState(AppState.MENU);
    }
  };

  const startAssessment = async (count: number) => {
    setState(AppState.GENERATING);
    setLoadingProgress(0);
    setErrorMsg('');

    // Fake progress for visual feedback while API works
    const interval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + (Math.random() * 5), 90));
    }, 200);

    try {
      const q = await generateAssessmentQuestions(count);
      clearInterval(interval);
      setLoadingProgress(100);
      setQuestions(q);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      
      setTimeout(() => setState(AppState.ASSESSMENT), 500);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(`CONNECTION FAILED: ${err.message || "UNKNOWN ERROR"}`);
      setState(AppState.ERROR);
    }
  };

  const handleAnswer = (option: string) => {
    const timeTaken = Date.now() - questionStartTime.current;
    const currentQ = questions[currentQuestionIndex];
    
    const newAnswer: Answer = {
      questionId: currentQ.id,
      questionText: currentQ.text,
      dimension: currentQ.dimension,
      selectedOption: option,
      timeTaken: timeTaken
    };
    
    setAnswers(prev => [...prev, newAnswer]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishAssessment([...answers, newAnswer]);
    }
  };

  const finishAssessment = async (finalAnswers: Answer[]) => {
    setState(AppState.ANALYZING);
    setLoadingProgress(0);
    
    const interval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + (Math.random() * 2), 90));
    }, 150);

    try {
      const result = await analyzePersonality(finalAnswers, username);
      clearInterval(interval);
      setLoadingProgress(100);
      setReport(result);

      // Update Leaderboard
      const newEntry: LeaderboardEntry = {
        id: Math.random().toString(36).substr(2, 9),
        username: username,
        score: result.score,
        date: new Date().toISOString()
      };
      
      const updatedLB = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
      setLeaderboard(updatedLB);
      localStorage.setItem('psyche7_leaderboard', JSON.stringify(updatedLB));

      setTimeout(() => setState(AppState.RESULT), 800);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(`ANALYSIS FAILED: ${err.message || "DATA CORRUPTED"}`);
      setState(AppState.ERROR);
    }
  };

  // --- VIEWS ---

  const renderBoot = () => (
    <div className="flex flex-col items-center justify-center h-screen text-term-green">
      <div className="font-display text-4xl mb-4 tracking-widest animate-pulse">PSYCHE-7</div>
      <div className="font-mono text-sm space-y-1 opacity-80">
        <TypewriterText text="> MOUNTING KERNEL..." speed={30} />
        <br />
        <TypewriterText text="> ESTABLISHING SECURE HANDSHAKE..." speed={20} />
        <br />
        <TypewriterText text="> CALIBRATING NEURAL WEIGHTS..." speed={40} />
      </div>
    </div>
  );

  const renderAuth = () => (
    <div className="flex flex-col items-center justify-center h-screen w-full max-w-md mx-auto px-4">
       <Panel className="w-full">
         <div className="text-center mb-8">
           <h1 className="font-display text-3xl text-term-green mb-2">IDENTIFICATION</h1>
           <p className="font-mono text-xs text-term-green-dim">ENTER CREDENTIALS TO PROCEED</p>
         </div>
         <form onSubmit={handleLogin} className="space-y-6">
           <div>
             <label className="block font-mono text-xs text-term-green mb-2">CODENAME</label>
             <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              className="w-full bg-black border-b border-term-green text-term-green font-mono p-2 focus:outline-none focus:border-term-cyan transition-colors"
              placeholder="ENTER ALIAS..."
              autoFocus
             />
           </div>
           <TerminalButton onClick={() => {}} className="w-full" disabled={username.length < 3}>
             ACCESS TERMINAL
           </TerminalButton>
         </form>
       </Panel>
    </div>
  );

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-screen w-full max-w-4xl mx-auto px-6">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="font-display text-4xl text-term-green border-b border-term-green/30 pb-4">
            EVALUATION PROTOCOLS
          </h2>
          <p className="font-mono text-sm text-gray-400">
            Select scan depth. Deeper scans yield higher confidence metrics but require increased cognitive load.
          </p>
          
          <div className="space-y-4 pt-4">
            <TerminalButton onClick={() => startAssessment(QuestionCount.SHORT)} className="w-full text-left">
              <div className="flex justify-between items-center w-full">
                <span>QUICK SCAN (20 Q)</span>
                <span className="text-xs opacity-50">EST. 5 MIN</span>
              </div>
            </TerminalButton>
            <TerminalButton onClick={() => startAssessment(QuestionCount.MEDIUM)} className="w-full text-left">
              <div className="flex justify-between items-center w-full">
                 <span>STANDARD PROFILE (50 Q)</span>
                 <span className="text-xs opacity-50">EST. 15 MIN</span>
              </div>
            </TerminalButton>
            <TerminalButton onClick={() => startAssessment(QuestionCount.FULL)} className="w-full text-left">
               <div className="flex justify-between items-center w-full">
                 <span>DEEP PSYCHE ANALYSIS (100 Q)</span>
                 <span className="text-xs opacity-50">EST. 30 MIN</span>
               </div>
            </TerminalButton>
          </div>
        </div>

        <div className="space-y-6">
           <Panel title="GLOBAL RANKINGS" className="h-full">
              <div className="overflow-y-auto h-64 space-y-2 pr-2">
                <table className="w-full text-left font-mono text-sm">
                  <thead>
                    <tr className="text-term-green-dim border-b border-term-green/20">
                      <th className="pb-2">RANK</th>
                      <th className="pb-2">AGENT</th>
                      <th className="pb-2 text-right">STABILITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => (
                      <tr key={entry.id} className="text-term-green/80 hover:text-term-cyan transition-colors">
                        <td className="py-1">{idx + 1}</td>
                        <td className="py-1">{entry.username}</td>
                        <td className="py-1 text-right">{entry.score.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </Panel>
           
           <div className="border border-term-red/30 p-4 text-xs font-mono text-term-red/80">
              WARNING: UNAUTHORIZED DISSEMINATION OF PSYCHOMETRIC DATA IS PUNISHABLE BY TERMINATION OF CONTRACT AND IMMEDIATE MEMORY WIPING.
           </div>
        </div>
      </div>
    </div>
  );

  const renderAssessment = () => {
    if (questions.length === 0) return null;
    const q = questions[currentQuestionIndex];

    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-3xl mx-auto px-6 py-12">
        <div className="w-full mb-8">
           <LoadingBar progress={((currentQuestionIndex) / questions.length) * 100} label="EVALUATION PROGRESS" />
        </div>

        <Panel className="w-full mb-8" title={`QUERY ${currentQuestionIndex + 1}/${questions.length}`}>
          <div className="min-h-[120px] flex items-center">
            <h3 className="font-display text-xl md:text-2xl text-term-cyan tracking-wide leading-relaxed">
              {q.text}
            </h3>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 w-full">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className="group text-left p-4 border border-term-green/30 hover:bg-term-green/10 hover:border-term-green transition-all duration-200 flex items-center"
            >
              <span className="font-mono text-term-green mr-4 text-lg opacity-50 group-hover:opacity-100">
                {String.fromCharCode(65 + idx)} //
              </span>
              <span className="font-mono text-gray-300 group-hover:text-white text-sm md:text-base">
                {option}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLoading = (label: string) => (
    <div className="flex flex-col items-center justify-center h-screen w-full max-w-xl mx-auto px-6">
      <div className="w-full space-y-4">
        <LoadingBar progress={loadingProgress} label={label} />
        <div className="h-32 font-mono text-xs text-term-green-dim overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
          {/* Simulated logs */}
          <div className="space-y-1 opacity-60">
             <p>{`> access_node: ${Math.random().toString(16).substr(2,8)}`}</p>
             <p>{`> encrypting_packet_stream...`}</p>
             <p>{`> querying_subconscious_constructs...`}</p>
             <p>{`> correlating_vectors [${loadingProgress.toFixed(0)}%]`}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReport = () => {
    if (!report) return null;

    return (
      <div className="min-h-screen w-full max-w-5xl mx-auto px-6 py-12 overflow-y-auto pb-20">
        <div className="flex justify-between items-end mb-8 border-b border-term-green/30 pb-4">
           <div>
             <h1 className="font-display text-4xl text-white mb-1">DOSSIER: {report.subjectName}</h1>
             <p className="font-mono text-xs text-term-green">REF: {Math.random().toString(36).substr(2, 9).toUpperCase()} // CLASSIFIED</p>
           </div>
           <div className="text-right">
             <div className="text-xs text-term-green-dim mb-1">STABILITY SCORE</div>
             <div className="font-display text-5xl text-term-cyan">{report.score}/100</div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col */}
          <div className="lg:col-span-2 space-y-8">
             <Panel title="DOMINANT TRAITS">
               <div className="flex flex-wrap gap-2">
                 {report.dominantTraits.map((trait, i) => (
                   <span key={i} className="px-3 py-1 bg-term-green/10 border border-term-green/40 text-term-green text-sm font-mono">
                     {trait}
                   </span>
                 ))}
               </div>
             </Panel>

             <Panel title="BEHAVIORAL ANALYSIS">
               <ul className="list-disc list-outside ml-4 space-y-2 font-mono text-sm text-gray-300">
                  {report.behavioralTendencies.map((item, i) => (
                    <li key={i}><span className="text-term-green/70">::</span> {item}</li>
                  ))}
               </ul>
             </Panel>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel title="OPERATIONAL STRENGTHS">
                  <ul className="space-y-2 font-mono text-xs text-term-cyan/90">
                    {report.strengths.map((item, i) => (
                      <li key={i}>+ {item}</li>
                    ))}
                  </ul>
                </Panel>
                <Panel title="VULNERABILITIES">
                  <ul className="space-y-2 font-mono text-xs text-term-amber/90">
                    {report.weaknesses.map((item, i) => (
                      <li key={i}>! {item}</li>
                    ))}
                  </ul>
                </Panel>
             </div>
          </div>

          {/* Right Col */}
          <div className="space-y-8">
             <Panel title="RISK ASSESSMENT" className="border-term-red/50">
               <ul className="space-y-3 font-mono text-xs text-term-red">
                 {report.riskIndicators.length > 0 ? report.riskIndicators.map((risk, i) => (
                   <li key={i} className="flex items-start">
                     <span className="mr-2">WARNING:</span> {risk}
                   </li>
                 )) : <li>NO CRITICAL ANOMALIES DETECTED.</li>}
               </ul>
             </Panel>

             <div className="border border-term-green/20 p-4 bg-term-black">
               <div className="text-xs text-term-green-dim mb-2">ALGORITHM CONFIDENCE</div>
               <div className="h-2 bg-term-green/10 w-full mb-1">
                 <div className="h-full bg-term-green/50" style={{ width: `${report.confidenceScore}%`}}></div>
               </div>
               <div className="text-right text-xs font-mono text-term-green">{report.confidenceScore}% VERIFIED</div>
             </div>

             <TerminalButton onClick={() => setState(AppState.MENU)} className="w-full">
               CLOSE DOSSIER
             </TerminalButton>
             
             <div className="text-center">
                 <p className="text-[10px] text-gray-600 font-mono mt-4">
                   This evaluation is AI-generated and for entertainment purposes only. Do not use for clinical diagnosis.
                 </p>
             </div>
          </div>

        </div>
      </div>
    );
  };

  const renderError = () => (
     <div className="flex flex-col items-center justify-center h-screen text-term-red">
       <div className="font-display text-4xl mb-4">SYSTEM FAILURE</div>
       <p className="font-mono mb-8">{errorMsg}</p>
       <TerminalButton onClick={() => setState(AppState.MENU)} variant="danger">
         REBOOT SYSTEM
       </TerminalButton>
     </div>
  );

  return (
    <div className="min-h-screen bg-black text-white relative z-10 selection:bg-term-green selection:text-black">
      {state === AppState.BOOTING && renderBoot()}
      {state === AppState.AUTH && renderAuth()}
      {state === AppState.MENU && renderMenu()}
      {state === AppState.GENERATING && renderLoading("GENERATING NEURAL PATHWAYS...")}
      {state === AppState.ASSESSMENT && renderAssessment()}
      {state === AppState.ANALYZING && renderLoading("COMPILING PSYCHOMETRIC DATA...")}
      {state === AppState.RESULT && renderReport()}
      {state === AppState.ERROR && renderError()}
    </div>
  );
};

export default App;