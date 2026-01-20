
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
  InformationCircleIcon
} from '@heroicons/react/24/solid';

// --- Helper Functions for Audio Processing (as per GenAI guidelines) ---
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
  
  // Voice API Refs
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

  const calculateRebate = (type: string) => {
    const values: Record<string, number> = {
      'heatpump': 7100,
      'insulation': 1500,
      'hybrid': 10500,
      'smart': 600
    };
    setRebateValue(values[type] || 0);
    setShowRebateTool(true);
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
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopVoiceDemo(),
          onerror: (e) => console.error("Voice Error:", e),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: 'You are Melissa, a friendly and ultra-professional AI receptionist for Peel AI. Your goal is to demo your capabilities to HVAC contractors in Toronto. You speak clearly, sound human, and are very helpful. You can mention GTA areas like Brampton, Oakville, or Toronto. Keep it concise and impressive.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Mic access denied or API error", err);
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
      {/* Navigation */}
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
            <button onClick={() => scrollToSection('rebates')} className="hover:text-orange-500 transition-colors font-black uppercase tracking-wider">Rebates</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-orange-500 transition-colors font-black uppercase tracking-wider">Pricing</button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
            </button>
            <a 
              href={`tel:${CONFIG.emergencyPhone}`} 
              className="bg-blue-700 text-white px-6 py-2.5 rounded-full font-black shadow-lg shadow-blue-500/20 hover:bg-blue-800 transition-all active:scale-95 flex items-center gap-2"
            >
              <PhoneIcon className="w-4 h-4" />
              {CONFIG.emergencyPhone}
            </a>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 pt-24 px-6 md:hidden flex flex-col gap-8 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center">
             <span className="font-black text-xl">{CONFIG.companyName}</span>
             <button onClick={() => setIsMenuOpen(false)}><XMarkIcon className="w-8 h-8" /></button>
          </div>
          <button onClick={() => scrollToSection('features')} className="text-3xl font-black text-left">Features</button>
          <button onClick={() => scrollToSection('rebates')} className="text-3xl font-black text-left">Rebates</button>
          <button onClick={() => scrollToSection('pricing')} className="text-3xl font-black text-left">Pricing</button>
          <a href={`tel:${CONFIG.emergencyPhone}`} className="text-blue-600 text-3xl font-black flex items-center gap-4">
             <PhoneIcon className="w-8 h-8" /> {CONFIG.emergencyPhone}
          </a>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-4 text-3xl font-black">
             {isDarkMode ? <SunIcon className="w-8 h-8 text-yellow-500" /> : <MoonIcon className="w-8 h-8" />} 
             {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
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
              <button 
                onClick={startVoiceDemo}
                className={`px-10 py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 group relative overflow-hidden ${isVoiceActive ? 'bg-red-500 text-white shadow-red-500/40' : 'bg-blue-700 text-white shadow-blue-500/40 hover:bg-blue-800'}`}
              >
                <div className={`flex items-end gap-1 h-6 ${isVoiceActive ? 'animate-waveform' : ''}`}>
                  <div className="w-1.5 bg-white rounded-full"></div>
                  <div className="w-1.5 bg-white rounded-full"></div>
                  <div className="w-1.5 bg-white rounded-full"></div>
                </div>
                {isVoiceActive ? 'Hang Up' : 'Live Voice Demo'}
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              >
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
      <section id="features" className="py-32 px-4 md:px-8 bg-white/30 dark:bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Core Technology</span>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Built Specifically for HVAC Pros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CONFIG.pricing[1].features.slice(1, 4).map((f, i) => (
              <FeatureCard key={i} title={f} icon={<CheckBadgeIcon className="w-8 h-8 text-blue-600"/>} description="Enterprise-grade features optimized for the local Toronto HVAC market." />
            ))}
            <FeatureCard title="24/7 Voice" icon={<MicrophoneIcon className="w-8 h-8 text-orange-600"/>} description="Melissa never sleeps. She's always ready to take emergency calls." />
            <FeatureCard title="SMS Alerts" icon={<ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-teal-600"/>} description="Get instant transcripts of every AI-handled call directly to your phone." />
            <FeatureCard title="Calendar Sync" icon={<CalendarIcon className="w-8 h-8 text-rose-600"/>} description="Integrates with Jobber, Housecall Pro, and more." />
          </div>
        </div>
      </section>

      {/* Rebates Section */}
      <section id="rebates" className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-[4rem] p-8 md:p-20 text-white overflow-hidden relative border border-white/5">
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <span className="bg-orange-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase mb-8 inline-block tracking-[0.2em]">2026 Ontario Program</span>
                <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter">
                  Close Sales Faster <br/>With <span className="text-orange-400">{CONFIG.rebateAmount}</span> Rebates
                </h2>
                <div className="grid grid-cols-2 gap-5 mb-10">
                   <button onClick={() => calculateRebate('heatpump')} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-all text-left group">
                     <div className="font-black text-3xl mb-1 group-hover:text-orange-400 transition-colors">$7,100</div>
                     <div className="text-[10px] uppercase tracking-widest font-black text-blue-300">Hybrid Heat Pump</div>
                   </button>
                   <button onClick={() => calculateRebate('insulation')} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-all text-left group">
                     <div className="font-black text-3xl mb-1 group-hover:text-orange-400 transition-colors">$1,500</div>
                     <div className="text-[10px] uppercase tracking-widest font-black text-blue-300">Attic Insulation</div>
                   </button>
                </div>
                {showRebateTool && (
                   <div className="mb-8 p-6 bg-blue-500/20 rounded-3xl border border-blue-400/30 flex items-center justify-between animate-in zoom-in duration-300">
                      <div>
                        <div className="text-sm font-black uppercase">Instant Estimate</div>
                        <div className="text-4xl font-black text-orange-400">${rebateValue} Savings</div>
                      </div>
                      <button onClick={() => setShowRebateTool(false)} className="text-xs font-black uppercase tracking-widest hover:underline">Clear</button>
                   </div>
                )}
                <button onClick={() => scrollToSection('audit-form')} className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-blue-50 transition-all active:scale-95 shadow-2xl">
                  Try Demo Rebate Tool
                </button>
              </div>
              <div className="flex-1 w-full hidden lg:block">
                <div className="glass-card !bg-white/5 !border-white/10 p-10 rounded-[3rem] w-full max-w-md mx-auto shadow-2xl">
                   <h3 className="text-xl font-black mb-8 text-center uppercase tracking-widest flex items-center justify-center gap-2"><BoltIcon className="w-6 h-6 text-orange-400" /> Active GTA Incentives</h3>
                   <div className="space-y-8">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="font-bold text-blue-200">HER+ Ontario</span>
                        <span className="font-black text-orange-400 text-2xl">$10,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="font-bold text-blue-200">Enbridge Heat Pump</span>
                        <span className="font-black text-orange-400 text-2xl">$7,100</span>
                      </div>
                      <div className="pt-6 text-center text-[10px] font-black tracking-widest opacity-30 italic uppercase">
                        *Live Data Fed From NRCAN 2026
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

      {/* Footer / Audit Form */}
      <footer id="audit-form" className="bg-slate-950 text-white pt-32 pb-16 px-4 md:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32">
            <div>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[0.9] tracking-tighter">Automate Your <br/>HVAC Business.</h2>
              <div className="flex items-center gap-6 mt-16">
                 <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800 shadow-xl">
                    <PhoneIcon className="w-8 h-8 text-orange-500" />
                 </div>
                 <div>
                   <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Direct Line</div>
                   <div className="text-2xl font-black tracking-tight">{CONFIG.emergencyPhone}</div>
                 </div>
              </div>
            </div>

            <div className="glass-card !bg-white/5 !border-white/10 p-10 md:p-14 rounded-[4rem] shadow-2xl">
              <h3 className="text-3xl font-black mb-10 tracking-tight">Claim Your Free AI Audit</h3>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Thanks! We will send your demo site soon."); }}>
                <input type="text" required placeholder="Toronto HVAC Co" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 focus:ring-2 focus:ring-blue-600 transition-all outline-none font-bold" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input type="email" required placeholder="owner@hvac.com" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 focus:ring-2 focus:ring-blue-600 transition-all outline-none font-bold" />
                  <input type="tel" required placeholder="416-000-0000" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 focus:ring-2 focus:ring-blue-600 transition-all outline-none font-bold" />
                </div>
                <button type="submit" className="w-full bg-blue-700 text-white py-6 rounded-2xl font-black text-xl hover:bg-blue-800 transition-all active:scale-95 shadow-2xl shadow-blue-500/30">
                  Get My Free Demo Site
                </button>
              </form>
            </div>
          </div>

          <div className="pt-16 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                 <MicrophoneIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm">Peel AI Systems</span>
            </div>
            <div className="flex gap-12">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white transition-colors">Back to Top</button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-white transition-colors flex items-center gap-1"><InformationCircleIcon className="w-4 h-4" /> Billing Info</a>
              <span className="opacity-30">GTA Service Hub 2026</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 p-4">
        <div className="glass-card flex items-center justify-between p-3 rounded-3xl border border-white/40 shadow-2xl">
           <a href={`tel:${CONFIG.emergencyPhone}`} className="flex flex-col items-center gap-0.5 px-4 text-blue-700">
             <PhoneIcon className="w-6 h-6" />
             <span className="text-[10px] font-black uppercase">Call</span>
           </a>
           <button 
            onClick={startVoiceDemo}
            className={`flex-grow mx-4 rounded-2xl py-4 font-black text-sm shadow-xl active:scale-95 flex items-center justify-center gap-2 ${isVoiceActive ? 'bg-red-500 text-white' : 'bg-blue-700 text-white'}`}
           >
             {isVoiceActive ? 'End AI' : 'Talk To AI'}
           </button>
           <button onClick={() => scrollToSection('audit-form')} className="flex flex-col items-center gap-0.5 px-4 text-slate-600">
             <StarIcon className="w-6 h-6" />
             <span className="text-[10px] font-black uppercase">Demo</span>
           </button>
        </div>
      </div>
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
