
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  ChatBubbleBottomCenterTextIcon, 
  CheckBadgeIcon, 
  LightBulbIcon, 
  ShieldCheckIcon,
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  StarIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  BoltIcon,
  InformationCircleIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserCircleIcon
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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
    <div className="min-h-screen mesh-gradient selection:bg-orange-200 dark:selection:bg-blue-900">
      <nav className="sticky top-0 z-50 glass-card px-4 py-3 md:px-8 border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <MicrophoneIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight hidden sm:block">{CONFIG.companyName}</span>
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <button onClick={() => scrollToSection('features')} className="hover:text-orange-500 transition-colors font-black uppercase tracking-wider">Features</button>
            <button onClick={() => scrollToSection('analytics')} className="hover:text-orange-500 transition-colors font-black uppercase tracking-wider">Analytics</button>
            <button onClick={() => scrollToSection('rebates')} className="hover:text-orange-500 transition-colors font-black uppercase tracking-wider">Rebates</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-orange-500 transition-colors font-black uppercase tracking-wider">Pricing</button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
              {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
            </button>
            <a href={`tel:${CONFIG.emergencyPhone}`} className="bg-blue-700 text-white px-6 py-2.5 rounded-full font-black shadow-lg shadow-blue-500/20 hover:bg-blue-800 flex items-center gap-2">
              <PhoneIcon className="w-4 h-4" /> {CONFIG.emergencyPhone}
            </a>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}</button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 pt-24 px-6 md:hidden flex flex-col gap-8 animate-in fade-in slide-in-from-top duration-300">
          <button onClick={() => scrollToSection('features')} className="text-3xl font-black text-left">Features</button>
          <button onClick={() => scrollToSection('analytics')} className="text-3xl font-black text-left">Analytics</button>
          <button onClick={() => scrollToSection('rebates')} className="text-3xl font-black text-left">Rebates</button>
          <button onClick={() => scrollToSection('pricing')} className="text-3xl font-black text-left">Pricing</button>
          <a href={`tel:${CONFIG.emergencyPhone}`} className="text-blue-600 text-3xl font-black flex items-center gap-4"><PhoneIcon className="w-8 h-8" /> {CONFIG.emergencyPhone}</a>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-black mb-6 uppercase tracking-widest">
              <span className={`w-2 h-2 rounded-full ${isVoiceActive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
              {isVoiceActive ? 'Live Call with Melissa' : 'The Future of HVAC Dispatching'}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
              Turn Missed Calls <br/>Into <span className="text-orange-500">Booked Jobs.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed font-medium">
              {CONFIG.heroSubheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
              <button onClick={startVoiceDemo} className={`px-10 py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white shadow-red-500/40' : 'bg-blue-700 text-white shadow-blue-500/40 hover:bg-blue-800'}`}>
                {isVoiceActive ? 'Hang Up' : 'Live Voice Demo'}
              </button>
              <button onClick={() => scrollToSection('pricing')} className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 flex items-center justify-center gap-2 dark:bg-slate-800 dark:text-white dark:border-slate-700">
                View Plans <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <HeroAnimation isActive={isVoiceActive} />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Core Technology</span>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Built Specifically for HVAC Pros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard title="24/7 AI Voice" icon={<MicrophoneIcon className="w-8 h-8 text-blue-600"/>} description="Melissa handles every call instantly, from midnight furnace failures to routine maintenance." />
            <FeatureCard title="Live Booking" icon={<CalendarIcon className="w-8 h-8 text-orange-600"/>} description="Syncs directly with Jobber, Housecall Pro, and ServiceTitan to book jobs on the spot." />
            <FeatureCard title="SMS Lead Alerts" icon={<ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-teal-600"/>} description="Get instant transcripts and high-priority lead notifications sent to your tech's phone." />
          </div>
        </div>
      </section>

      {/* Advanced Analytics Section */}
      <section id="analytics" className="py-24 px-4 md:px-8 bg-slate-900/5 dark:bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <span className="bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase inline-block tracking-[0.2em]">New: Advanced Analytics</span>
              <h2 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter">Data-Driven <br/><span className="text-blue-600">Growth Insights.</span></h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Stop guessing. See exactly how many calls Melissa is converting into real revenue with our enterprise-grade dashboard.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 glass-card rounded-3xl border border-white/20 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-black">94%</div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Conversion Rate</div>
                  </div>
                </div>
                <div className="p-6 glass-card rounded-3xl border border-white/20 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <UserCircleIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-black">2.4m</div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Avg. Call Time</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="bg-[#020617] p-8 md:p-12 rounded-[4rem] border border-white/5 shadow-3xl">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Live Volume Feed</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">Last 7 Days</div>
                </div>
                
                {/* Mock Chart Visualization */}
                <div className="h-64 flex items-end justify-between gap-2 md:gap-4 mb-8">
                  {[40, 65, 45, 80, 55, 95, 70].map((height, i) => (
                    <div key={i} className="flex-1 group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {height}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-blue-900 to-blue-500 rounded-t-xl transition-all duration-1000 ease-out group-hover:brightness-125"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="mt-4 text-[8px] font-black uppercase text-slate-600 text-center">Day {i+1}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Calls</div>
                    <div className="text-xl font-black">1,284</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Booked</div>
                    <div className="text-xl font-black text-blue-400">412</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Revenue</div>
                    <div className="text-xl font-black text-orange-400">$184k</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rebates Section (Refined) */}
      <section id="rebates" className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0F172A] rounded-[4rem] p-8 md:p-20 text-white overflow-hidden relative border border-white/10 shadow-2xl">
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <span className="bg-orange-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase mb-8 inline-block tracking-[0.2em]">2026 Ontario Program</span>
                <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter">
                  Close Sales Faster <br/>With <span className="text-orange-400">$10,500</span> Rebates
                </h2>
                <div className="grid grid-cols-2 gap-5 mb-10">
                   <button 
                     onClick={() => toggleRebate('heatpump', 7100)} 
                     className={`p-8 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${selectedRebates.includes('heatpump') ? 'bg-blue-600/20 border-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                   >
                     <div className={`font-black text-4xl mb-1 ${selectedRebates.includes('heatpump') ? 'text-white' : 'group-hover:text-orange-400'}`}>$7,100</div>
                     <div className="text-[10px] uppercase tracking-widest font-black text-blue-300">Hybrid Heat Pump</div>
                     {selectedRebates.includes('heatpump') && <CheckBadgeIcon className="absolute top-4 right-4 w-6 h-6 text-blue-400" />}
                   </button>
                   <button 
                     onClick={() => toggleRebate('insulation', 1500)} 
                     className={`p-8 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${selectedRebates.includes('insulation') ? 'bg-blue-600/20 border-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                   >
                     <div className={`font-black text-4xl mb-1 ${selectedRebates.includes('insulation') ? 'text-white' : 'group-hover:text-orange-400'}`}>$1,500</div>
                     <div className="text-[10px] uppercase tracking-widest font-black text-blue-300">Attic Insulation</div>
                     {selectedRebates.includes('insulation') && <CheckBadgeIcon className="absolute top-4 right-4 w-6 h-6 text-blue-400" />}
                   </button>
                </div>
                {showRebateTool && (
                   <div className="mb-8 p-8 bg-blue-600 rounded-[2rem] border border-blue-400 flex items-center justify-between animate-in zoom-in duration-300 shadow-xl shadow-blue-500/20">
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-blue-100">Total Customer Savings</div>
                        <div className="text-5xl font-black text-white">${rebateValue.toLocaleString()}</div>
                      </div>
                      <button onClick={() => { setShowRebateTool(false); setSelectedRebates([]); setRebateValue(0); }} className="bg-white/10 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white/20">Reset</button>
                   </div>
                )}
                <button onClick={() => scrollToSection('audit-form')} className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-blue-50 shadow-2xl">
                  Try Demo Rebate Tool
                </button>
              </div>
              <div className="flex-1 w-full hidden lg:block">
                <div className="glass-card !bg-[#1E293B] !border-white/10 p-12 rounded-[3rem] w-full max-w-md mx-auto shadow-2xl">
                   <h3 className="text-xl font-black mb-10 text-center uppercase tracking-widest flex items-center justify-center gap-3"><BoltIcon className="w-6 h-6 text-orange-400" /> Active GTA Incentives</h3>
                   <div className="space-y-10">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="font-bold text-blue-100">HER+ Ontario</span>
                        <span className="font-black text-orange-400 text-3xl">$10,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="font-bold text-blue-100">Enbridge Bonus</span>
                        <span className="font-black text-orange-400 text-3xl">$7,100</span>
                      </div>
                      <div className="pt-8 text-center text-[10px] font-black tracking-widest opacity-40 uppercase italic">
                        *Live Data Fed From NRCAN 2026 Guidelines
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-4 md:px-8 bg-slate-950 text-white rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter">Simple Pricing.</h2>
            <p className="text-2xl text-slate-400 font-medium">No contracts. No hidden fees. Cancel in 1-click.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
            {CONFIG.pricing.map((tier, i) => (
              <div 
                key={i} 
                className={`p-10 md:p-12 rounded-[4rem] flex flex-col transition-all duration-500 hover:scale-[1.02] ${tier.popular ? 'bg-white text-slate-900 shadow-[0_0_80px_rgba(30,64,175,0.3)]' : 'bg-slate-900/50 text-white border border-slate-800'}`}
              >
                <h3 className="text-3xl font-black mb-4 tracking-tight text-center">{tier.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-8">
                  <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                  <span className="text-slate-400 font-bold">/mo</span>
                </div>
                <div className="space-y-6 mb-14 flex-grow">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <CheckBadgeIcon className={`w-5 h-5 ${tier.popular ? 'text-blue-600' : 'text-blue-400'}`} />
                      <span className="text-sm font-black uppercase tracking-widest">{f}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => scrollToSection('audit-form')} 
                  className={`w-full py-6 rounded-[2rem] font-black text-xl transition-all active:scale-95 ${tier.popular ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-2xl shadow-blue-500/40' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Form Section */}
      <section id="audit-form" className="py-32 px-4 md:px-8 bg-[#020617] text-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1">
              <h2 className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter">Automate Your <br/><span className="text-blue-500">HVAC Business.</span></h2>
              <p className="text-xl text-slate-400 mb-12 max-w-lg leading-relaxed font-medium">Join 200+ contractors in Toronto who are booking more high-efficiency jobs while they sleep.</p>
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center border border-slate-800 shadow-xl">
                    <PhoneIcon className="w-8 h-8 text-orange-500" />
                 </div>
                 <div>
                   <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Direct Line</div>
                   <div className="text-3xl font-black tracking-tight">{CONFIG.emergencyPhone}</div>
                 </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-xl">
               <div className="glass-card !bg-white/5 !border-white/10 p-12 md:p-16 rounded-[4rem] shadow-3xl relative border">
                  <div className="absolute -top-4 -right-4 bg-blue-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">30s Setup</div>
                  <h3 className="text-4xl font-black mb-10 tracking-tight">Claim Your Free AI Audit</h3>
                  <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Audit received! Our team will contact you shortly."); }}>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company Name</label>
                       <input type="text" required placeholder="Toronto HVAC Co" className="w-full bg-[#0F172A] border border-white/5 rounded-2xl p-6 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold placeholder:opacity-30" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                          <input type="email" required placeholder="owner@hvac.com" className="w-full bg-[#0F172A] border border-white/5 rounded-2xl p-6 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold placeholder:opacity-30" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Number</label>
                          <input type="tel" required placeholder="416-000-0000" className="w-full bg-[#0F172A] border border-white/5 rounded-2xl p-6 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold placeholder:opacity-30" />
                       </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all active:scale-95 shadow-2xl shadow-blue-500/20 mt-6 group">
                      Get My Free Demo Site <ArrowRightIcon className="inline w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <p className="text-[10px] text-center text-slate-500 mt-6 font-medium">No credit card required. Free setup for 2026 HVAC season.</p>
                  </form>
               </div>
            </div>
        </div>
      </section>

      {/* Professional HVAC Footer */}
      <footer className="bg-[#020617] text-white pt-24 pb-12 px-4 md:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                  <MicrophoneIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-xl tracking-tight">Peel AI Systems</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-medium">
                Toronto's leading AI-voice automation platform designed specifically for HVAC contractors and home service pros.
              </p>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"><CpuChipIcon className="w-4 h-4" /></div>
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"><WrenchScrewdriverIcon className="w-4 h-4" /></div>
              </div>
            </div>

            {/* Service Areas Column */}
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-blue-400 mb-8">Areas We Serve</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-bold">
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-default"><MapPinIcon className="w-4 h-4 text-blue-700" /> Toronto & North York</li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-default"><MapPinIcon className="w-4 h-4 text-blue-700" /> Mississauga & Etobicoke</li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-default"><MapPinIcon className="w-4 h-4 text-blue-700" /> Brampton & Caledon</li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-default"><MapPinIcon className="w-4 h-4 text-blue-700" /> Markham & Richmond Hill</li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-default"><MapPinIcon className="w-4 h-4 text-blue-700" /> Oakville & Burlington</li>
              </ul>
            </div>

            {/* Platform Column */}
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-blue-400 mb-8">SaaS Platform</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-bold">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Core Features</button></li>
                <li><button onClick={() => scrollToSection('analytics')} className="hover:text-white transition-colors">Advanced Analytics</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing Plans</button></li>
                <li><button onClick={() => scrollToSection('rebates')} className="hover:text-white transition-colors">Rebate Tools</button></li>
                <li><a href="#" className="hover:text-white transition-colors">White-Label Docs</a></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-blue-400 mb-8">Get Support</h4>
              <div className="space-y-6">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500 transition-all group">
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Contractor Helpdesk</div>
                    <div className="text-sm font-black group-hover:text-blue-400">1-888-PEEL-HVAC</div>
                 </div>
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500 transition-all group">
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-1">General Inquiries</div>
                    <div className="text-sm font-black group-hover:text-blue-400">support@peelai.ca</div>
                 </div>
              </div>
            </div>
          </div>

          {/* Industry Trust Strip */}
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            <div className="flex flex-wrap justify-center gap-10 grayscale opacity-40">
               <span className="hover:opacity-100 transition-opacity cursor-default">TSSA Certified Hub</span>
               <span className="hover:opacity-100 transition-opacity cursor-default">HRAI Member</span>
               <span className="hover:opacity-100 transition-opacity cursor-default">Better Business Bureau</span>
               <span className="hover:opacity-100 transition-opacity cursor-default">Energy Star Partner</span>
            </div>
            <div className="flex gap-8">
              <span className="text-slate-700">© 2026 Peel AI Systems</span>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
  <div className="glass-card p-10 rounded-[3rem] hover:translate-y-[-10px] transition-all duration-500 group border-white shadow-lg">
    <div className="mb-8 bg-slate-50 dark:bg-slate-900 w-20 h-20 rounded-[1.5rem] flex items-center justify-center group-hover:bg-blue-50 transition-all shadow-sm">
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-4 tracking-tight uppercase">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{description}</p>
  </div>
);

export default App;
