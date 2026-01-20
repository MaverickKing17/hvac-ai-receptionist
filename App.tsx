
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  ChatBubbleBottomCenterTextIcon, 
  CheckBadgeIcon, 
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  CalendarIcon,
  BoltIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/solid';

// --- Helper Functions for Audio Processing ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const HeroAnimation: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className={`w-full h-full rounded-full border border-blue-400 dark:border-blue-600 ${isActive ? 'animate-pulse-ring' : 'opacity-20'}`}></div>
        <div className={`absolute w-[80%] h-[80%] rounded-full border border-orange-400 dark:border-orange-600 ${isActive ? 'animate-pulse-ring' : 'opacity-20'}`} style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-20 group">
        <div className={`absolute -inset-8 bg-blue-500/20 blur-3xl rounded-full transition-all duration-700 ${isActive ? 'opacity-100 scale-125' : 'opacity-0'}`}></div>
        <div className="relative w-40 h-40 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-white/50 dark:border-slate-800 animate-float">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-orange-500/10 rounded-[2.5rem]"></div>
          <div className="relative flex flex-col items-center gap-2">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-500 ${isActive ? 'bg-orange-500 shadow-orange-500/40' : 'bg-blue-700 shadow-blue-500/40'}`}>
              <MicrophoneIcon className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-black tracking-tighter text-blue-700 dark:text-blue-400">MELISSA AI</span>
            <div className="flex gap-1 items-center h-4">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-1 bg-blue-500 rounded-full transition-all duration-300 ${isActive ? 'animate-waveform' : 'h-1'}`} 
                  style={{ animationDelay: `${i * 0.15}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute w-full h-full animate-orbit">
        <div className="absolute top-0 left-1/2 -ml-6 w-12 h-12 glass-card rounded-xl flex items-center justify-center shadow-lg transform -rotate-12 border-orange-200">
          <PhoneIcon className="w-6 h-6 text-orange-500" />
        </div>
      </div>
      <div className="absolute w-full h-full animate-orbit" style={{ animationDelay: '-5s' }}>
        <div className="absolute top-0 left-1/2 -ml-6 w-12 h-12 glass-card rounded-xl flex items-center justify-center shadow-lg transform rotate-12 border-blue-200">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRebateTool, setShowRebateTool] = useState(false);
  const [rebateValue, setRebateValue] = useState<number>(0);
  const [selectedRebates, setSelectedRebates] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const toggleRebate = (type: string, value: number) => {
    if (selectedRebates.includes(type)) {
      setSelectedRebates(prev => prev.filter(r => r !== type));
      setRebateValue(prev => prev - value);
    } else {
      setSelectedRebates(prev => [...prev, type]);
      setRebateValue(prev => prev + value);
      setShowRebateTool(true);
    }
  };

  const startVoiceDemo = async () => {
    if (isVoiceActive) {
      stopVoiceDemo();
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outContextRef.current, 24000, 1);
              const source = outContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
          },
          onclose: () => stopVoiceDemo(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: 'You are Melissa, a friendly and ultra-professional AI receptionist for Peel AI.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      alert("Please allow microphone access to try the AI demo!");
    }
  };

  const stopVoiceDemo = () => {
    setIsVoiceActive(false);
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    if (outContextRef.current) outContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  return (
    <div className="min-h-screen mesh-gradient selection:bg-orange-200 dark:selection:bg-blue-900 transition-colors duration-500">
      <nav className="sticky top-0 z-50 glass-card px-4 py-4 md:px-8 border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-all">
              <MicrophoneIcon className="w-7 h-7 text-white" />
            </div>
            <span className="font-black text-xl md:text-2xl tracking-tighter hidden sm:block">Peel AI Systems</span>
          </button>
          <div className="hidden md:flex items-center gap-10 text-xs">
            <button onClick={() => scrollToSection('features')} className="hover:text-blue-500 transition-colors font-black uppercase tracking-[0.2em] dark:text-slate-100">Features</button>
            <button onClick={() => scrollToSection('analytics')} className="hover:text-blue-500 transition-colors font-black uppercase tracking-[0.2em] dark:text-slate-100">Analytics</button>
            <button onClick={() => scrollToSection('rebates')} className="hover:text-blue-500 transition-colors font-black uppercase tracking-[0.2em] dark:text-slate-100">Rebates</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-blue-500 transition-colors font-black uppercase tracking-[0.2em] dark:text-slate-100">Pricing</button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
              {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
            </button>
            <a href={`tel:${CONFIG.emergencyPhone}`} className="bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black shadow-2xl shadow-blue-500/30 hover:bg-blue-800 transition-all flex items-center gap-3 hover:scale-105 active:scale-95">
              <PhoneIcon className="w-5 h-5" /> {CONFIG.emergencyPhone}
            </a>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-xl hover:bg-white/10">
              {isMenuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 pt-32 px-10 md:hidden flex flex-col gap-10 animate-in fade-in slide-in-from-top duration-300">
          <button onClick={() => scrollToSection('features')} className="text-4xl font-black text-left tracking-tighter">Features</button>
          <button onClick={() => scrollToSection('analytics')} className="text-4xl font-black text-left tracking-tighter">Analytics</button>
          <button onClick={() => scrollToSection('rebates')} className="text-4xl font-black text-left tracking-tighter">Rebates</button>
          <button onClick={() => scrollToSection('pricing')} className="text-4xl font-black text-left tracking-tighter">Pricing</button>
          <a href={`tel:${CONFIG.emergencyPhone}`} className="text-blue-600 text-4xl font-black flex items-center gap-6"><PhoneIcon className="w-10 h-10" /> {CONFIG.emergencyPhone}</a>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-6 py-2 rounded-full text-[11px] font-black mb-8 uppercase tracking-[0.3em] shadow-xl shadow-blue-500/10">
              <span className={`w-2.5 h-2.5 rounded-full ${isVoiceActive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
              {isVoiceActive ? 'Melissa is Listening...' : 'HVAC SaaS Redefined'}
            </div>
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-10 leading-[0.8] tracking-tighter dark:text-white">
              Turn Missed Calls <br/>Into <span className="text-orange-500 drop-shadow-sm">Booked Jobs.</span>
            </h1>
            <p className="text-xl md:text-3xl text-slate-600 dark:text-slate-300 mb-14 max-w-2xl leading-tight font-bold opacity-90">
              Never lose a late-night lead again. Melissa handles dispatching while you focus on the wrench.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
              <button onClick={startVoiceDemo} className={`px-12 py-6 rounded-3xl font-black text-2xl shadow-3xl transition-all flex items-center justify-center gap-5 active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white shadow-red-500/40' : 'bg-blue-700 text-white shadow-blue-500/40 hover:bg-blue-800'}`}>
                {isVoiceActive ? 'Hang Up' : 'Live Voice Demo'} <MicrophoneIcon className="w-7 h-7" />
              </button>
              <button onClick={() => scrollToSection('pricing')} className="bg-white text-slate-950 border-2 border-slate-100 px-12 py-6 rounded-3xl font-black text-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 dark:bg-slate-900 dark:text-white dark:border-white/10 shadow-xl">
                View Plans <ArrowRightIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <HeroAnimation isActive={isVoiceActive} />
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="py-32 px-4 md:px-8 bg-slate-900/5 dark:bg-white/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1 space-y-10">
              <span className="bg-blue-600 text-white px-6 py-2 rounded-full text-[12px] font-black uppercase inline-block tracking-[0.3em] shadow-2xl shadow-blue-500/20">Market Intelligence</span>
              <h2 className="text-7xl md:text-9xl font-black leading-[0.8] tracking-tighter text-slate-900 dark:text-white">Growth <br/><span className="text-blue-600">Visible.</span></h2>
              <p className="text-2xl md:text-3xl text-slate-600 dark:text-slate-300 leading-tight font-bold max-w-lg">
                Stop guessing your ROI. See Melissa convert cold calls into confirmed tickets in real-time.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="p-8 glass-card rounded-[2.5rem] border border-white/20 shadow-2xl flex items-center gap-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center shadow-inner">
                    <ArrowTrendingUpIcon className="w-10 h-10 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">94%</div>
                    <div className="text-[12px] uppercase font-black tracking-widest text-blue-500 dark:text-blue-400">Success Rate</div>
                  </div>
                </div>
                <div className="p-8 glass-card rounded-[2.5rem] border border-white/20 shadow-2xl flex items-center gap-8">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center shadow-inner">
                    <UserCircleIcon className="w-10 h-10 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">2.4m</div>
                    <div className="text-[12px] uppercase font-black tracking-widest text-orange-500 dark:text-orange-400">Response Speed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="bg-[#020617] p-10 md:p-16 rounded-[4.5rem] border border-white/10 shadow-3xl ring-2 ring-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="flex justify-between items-center mb-16 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.7)]"></div>
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-200">System Live Feed</span>
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">Operational</div>
                </div>
                
                <div className="h-72 flex items-end justify-between gap-4 md:gap-7 mb-14 relative z-10">
                  {[45, 70, 50, 85, 60, 100, 75].map((height, i) => (
                    <div key={i} className="flex-1 group relative">
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-[12px] font-black px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-2xl scale-75 group-hover:scale-100">
                        {height}%
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-blue-900 to-blue-500 rounded-t-[1.5rem] transition-all duration-1000 ease-in-out group-hover:brightness-150 group-hover:scale-x-110 origin-bottom shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="mt-6 text-[11px] font-black uppercase text-slate-500 text-center tracking-tighter">Wk {i+1}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-12 border-t border-white/10 grid grid-cols-3 gap-8 relative z-10">
                  <div className="text-center">
                    <div className="text-[11px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em]">Total Traffic</div>
                    <div className="text-3xl font-black text-white">1,284</div>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <div className="text-[11px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em]">Closed Jobs</div>
                    <div className="text-3xl font-black text-blue-400">412</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em]">Est. Profit</div>
                    <div className="text-3xl font-black text-orange-400">$184k</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rebates Section */}
      <section id="rebates" className="py-32 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0F172A] rounded-[5rem] p-10 md:p-24 text-white overflow-hidden relative border border-white/10 shadow-3xl shadow-blue-900/40">
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-24">
              <div className="flex-1">
                <span className="bg-orange-500 text-white px-8 py-2.5 rounded-full text-[13px] font-black uppercase mb-10 inline-block tracking-[0.3em] shadow-2xl shadow-orange-500/30">Ontario Rebate Hub 2026</span>
                <h2 className="text-7xl md:text-9xl font-black mb-12 leading-[0.8] tracking-tighter">
                  Close Sales <br/>With <span className="text-orange-400">$10,500</span>
                </h2>
                <div className="grid grid-cols-2 gap-8 mb-14">
                   <button 
                     onClick={() => toggleRebate('heatpump', 7100)} 
                     className={`p-12 rounded-[3rem] border transition-all text-left group relative overflow-hidden shadow-2xl ${selectedRebates.includes('heatpump') ? 'bg-blue-600 border-blue-400 ring-4 ring-blue-500/20 scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'}`}
                   >
                     <div className={`font-black text-6xl mb-3 ${selectedRebates.includes('heatpump') ? 'text-white' : 'group-hover:text-orange-400 transition-colors'}`}>$7,100</div>
                     <div className="text-[13px] uppercase tracking-[0.2em] font-black text-blue-200">Hybrid Heat Pump</div>
                     {selectedRebates.includes('heatpump') && <CheckBadgeIcon className="absolute top-8 right-8 w-10 h-10 text-white" />}
                   </button>
                   <button 
                     onClick={() => toggleRebate('insulation', 1500)} 
                     className={`p-12 rounded-[3rem] border transition-all text-left group relative overflow-hidden shadow-2xl ${selectedRebates.includes('insulation') ? 'bg-blue-600 border-blue-400 ring-4 ring-blue-500/20 scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'}`}
                   >
                     <div className={`font-black text-6xl mb-3 ${selectedRebates.includes('insulation') ? 'text-white' : 'group-hover:text-orange-400 transition-colors'}`}>$1,500</div>
                     <div className="text-[13px] uppercase tracking-[0.2em] font-black text-blue-200">Attic Insulation</div>
                     {selectedRebates.includes('insulation') && <CheckBadgeIcon className="absolute top-8 right-8 w-10 h-10 text-white" />}
                   </button>
                </div>
                {showRebateTool && (
                   <div className="mb-14 p-12 bg-blue-700 rounded-[4rem] border border-blue-500 flex items-center justify-between animate-in zoom-in duration-500 shadow-3xl ring-2 ring-white/10">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-100 mb-4">Savings Dashboard Forecast</div>
                        <div className="text-7xl font-black text-white drop-shadow-xl">${rebateValue.toLocaleString()}</div>
                      </div>
                      <button onClick={() => { setShowRebateTool(false); setSelectedRebates([]); setRebateValue(0); }} className="bg-white/20 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/30 transition-all border border-white/10 active:scale-95">Clear Tool</button>
                   </div>
                )}
                <button onClick={() => scrollToSection('audit-form')} className="bg-white text-blue-950 px-14 py-7 rounded-[2.5rem] font-black text-2xl hover:bg-slate-50 transition-all shadow-3xl hover:scale-105 active:scale-95">
                  Launch Custom Proposal
                </button>
              </div>
              <div className="flex-1 w-full hidden lg:block">
                <div className="glass-card !bg-slate-800/80 !border-white/20 p-16 rounded-[5rem] w-full max-w-md mx-auto shadow-4xl ring-4 ring-white/5 relative">
                   <div className="absolute -top-6 -left-6 bg-blue-600 p-4 rounded-3xl shadow-2xl animate-float">
                      <BoltIcon className="w-10 h-10 text-white" />
                   </div>
                   <h3 className="text-3xl font-black mb-14 text-center uppercase tracking-widest text-white">Market Pulse</h3>
                   <div className="space-y-14">
                      <div className="flex justify-between items-center pb-8 border-b border-white/10 group">
                        <span className="font-bold text-slate-300 text-xl group-hover:text-white transition-colors">HER+ Program</span>
                        <span className="font-black text-orange-400 text-5xl">$10,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-8 border-b border-white/10 group">
                        <span className="font-bold text-slate-300 text-xl group-hover:text-white transition-colors">Enbridge Plus</span>
                        <span className="font-black text-orange-400 text-5xl">$7,100</span>
                      </div>
                      <div className="pt-12 text-center text-[11px] font-black tracking-[0.3em] text-slate-500 uppercase">
                        Verified: NRCAN 2026 Data Feed
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audit Form Section */}
      <section id="audit-form" className="py-40 px-4 md:px-8 bg-[#01040D] text-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-28 items-center">
            <div className="flex-1">
              <h2 className="text-8xl md:text-9xl lg:text-[10rem] font-black mb-14 leading-[0.75] tracking-tighter text-white">Scale Your <br/><span className="text-blue-600">Empire.</span></h2>
              <p className="text-3xl md:text-4xl text-slate-400 mb-16 max-w-2xl leading-tight font-black italic">Booking higher tickets while you sleep.</p>
              <div className="flex items-center gap-10">
                 <div className="w-24 h-24 bg-blue-900/30 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-3xl">
                    <PhoneIcon className="w-12 h-12 text-orange-500" />
                 </div>
                 <div>
                   <div className="text-[13px] uppercase font-black text-blue-500 tracking-[0.4em] mb-3">Enterprise Setup Line</div>
                   <div className="text-5xl font-black tracking-tighter text-white">{CONFIG.emergencyPhone}</div>
                 </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-2xl">
               <div className="glass-card !bg-white/5 !border-white/10 p-14 md:p-20 rounded-[5rem] shadow-4xl relative border ring-1 ring-white/10">
                  <div className="absolute -top-8 -right-8 bg-blue-600 px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-3xl ring-4 ring-blue-500/20">Fast-Track Setup</div>
                  <h3 className="text-6xl font-black mb-14 tracking-tighter">Get Your Audit</h3>
                  <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); alert("System Processing... Our team will call you within 15 minutes."); }}>
                    <div className="space-y-4">
                       <label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 ml-2">Official Company Name</label>
                       <input type="text" required placeholder="HVAC Toronto Co" className="w-full bg-[#080B14] border border-white/10 rounded-[2rem] p-8 focus:ring-4 focus:ring-blue-600/40 transition-all outline-none font-bold text-xl placeholder:text-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 ml-2">Business Email</label>
                          <input type="email" required placeholder="owner@hvac.ca" className="w-full bg-[#080B14] border border-white/10 rounded-[2rem] p-8 focus:ring-4 focus:ring-blue-600/40 transition-all outline-none font-bold text-xl placeholder:text-slate-800" />
                       </div>
                       <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 ml-2">Mobile Number</label>
                          <input type="tel" required placeholder="416-000-0000" className="w-full bg-[#080B14] border border-white/10 rounded-[2rem] p-8 focus:ring-4 focus:ring-blue-600/40 transition-all outline-none font-bold text-xl placeholder:text-slate-800" />
                       </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-700 text-white py-9 rounded-[2.5rem] font-black text-3xl hover:bg-blue-800 transition-all active:scale-[0.97] shadow-3xl shadow-blue-600/30 mt-12 group flex items-center justify-center gap-6">
                      Build My Demo <ArrowRightIcon className="w-10 h-10 group-hover:translate-x-4 transition-transform" />
                    </button>
                    <p className="text-[12px] text-center text-slate-500 mt-10 font-black tracking-widest uppercase">Verified Secure Setup • No CC Required</p>
                  </form>
               </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#01040D] text-white pt-40 pb-20 px-4 md:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
            {/* Brand Column */}
            <div className="space-y-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center shadow-2xl">
                  <MicrophoneIcon className="w-9 h-9 text-white" />
                </div>
                <span className="font-black text-3xl tracking-tighter">Peel AI</span>
              </div>
              <p className="text-slate-400 text-xl font-bold leading-snug">
                Toronto's leading automation engine for high-output HVAC contractors.
              </p>
              <div className="flex gap-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all border border-white/10 cursor-pointer shadow-2xl"><CpuChipIcon className="w-6 h-6" /></div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all border border-white/10 cursor-pointer shadow-2xl"><WrenchScrewdriverIcon className="w-6 h-6" /></div>
              </div>
            </div>

            {/* Service Areas */}
            <div>
              <h4 className="font-black text-[13px] uppercase tracking-[0.4em] text-blue-500 mb-12 border-l-4 border-blue-600 pl-6">GTA Hubs</h4>
              <ul className="space-y-6 text-lg text-slate-300 font-black">
                <li className="flex items-center gap-4 hover:text-white transition-all cursor-default group">
                  <MapPinIcon className="w-6 h-6 text-blue-600 group-hover:scale-125 transition-transform" /> Toronto Metro
                </li>
                <li className="flex items-center gap-4 hover:text-white transition-all cursor-default group">
                  <MapPinIcon className="w-6 h-6 text-blue-600 group-hover:scale-125 transition-transform" /> Peel Region
                </li>
                <li className="flex items-center gap-4 hover:text-white transition-all cursor-default group">
                  <MapPinIcon className="w-6 h-6 text-blue-600 group-hover:scale-125 transition-transform" /> Halton Region
                </li>
                <li className="flex items-center gap-4 hover:text-white transition-all cursor-default group">
                  <MapPinIcon className="w-6 h-6 text-blue-600 group-hover:scale-125 transition-transform" /> York Region
                </li>
              </ul>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-black text-[13px] uppercase tracking-[0.4em] text-blue-500 mb-12 border-l-4 border-blue-600 pl-6">Ecosystem</h4>
              <ul className="space-y-6 text-lg text-slate-300 font-black">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-blue-500 transition-colors">Core AI Features</button></li>
                <li><button onClick={() => scrollToSection('analytics')} className="hover:text-blue-500 transition-colors">Data Dashboard</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-blue-500 transition-colors">Pricing Plans</button></li>
                <li><button onClick={() => scrollToSection('rebates')} className="hover:text-blue-500 transition-colors">Rebate Optimization</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-black text-[13px] uppercase tracking-[0.4em] text-blue-500 mb-12 border-l-4 border-blue-600 pl-6">Priority Access</h4>
              <div className="space-y-10">
                 <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-blue-600 transition-all group shadow-4xl">
                    <div className="text-[12px] font-black uppercase text-blue-500 mb-3 tracking-[0.2em]">Partner Desk</div>
                    <div className="text-2xl font-black text-white">1-888-PEEL-HVAC</div>
                 </div>
                 <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-blue-600 transition-all group shadow-4xl">
                    <div className="text-[12px] font-black uppercase text-blue-500 mb-3 tracking-[0.2em]">Implementation</div>
                    <div className="text-2xl font-black text-white">support@peelai.ca</div>
                 </div>
              </div>
            </div>
          </div>

          <div className="pt-20 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-14">
            <div className="flex flex-wrap justify-center gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white cursor-default">TSSA Systems</span>
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white cursor-default">HRAI Member</span>
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white cursor-default">BBB A+ Rated</span>
            </div>
            <div className="flex gap-14 text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
              <span className="text-blue-600/60">© 2026 Peel AI Systems</span>
              <a href="#" className="hover:text-white transition-colors underline decoration-blue-900">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
