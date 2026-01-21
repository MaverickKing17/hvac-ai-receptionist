
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  CheckBadgeIcon,
  BoltIcon,
  ShieldCheckIcon,
  RectangleGroupIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  EnvelopeIcon,
  UserIcon,
  ArrowRightIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  BanknotesIcon,
  LifebuoyIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ArrowPathIcon,
  FireIcon,
  ChartBarIcon,
  CpuChipIcon
} from '@heroicons/react/24/solid';

// --- Webhook & Constants ---
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwhfqnUN4rTpJeQED9TBNphEOhkUxsBZrUIPL5Wvwxm/dev";
const CALENDLY_URL = "https://calendly.com/kingnarmer702/emergency-furnace-replacement-quote-priority";

// --- Audio Helpers ---
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

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

// UI Sound Chimes
const playChime = (type: 'sales' | 'support' | 'emergency') => {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.05, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(type === 'emergency' ? 1200 : type === 'sales' ? 880 : 523, ctx.currentTime);
  osc.connect(g);
  g.connect(masterGain);
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
  setTimeout(() => ctx.close(), 1000);
};

// --- Components ---

const FuturisticOrb: React.FC<{ isActive: boolean; mode: 'chloe' | 'sam'; status: 'idle' | 'connecting' | 'connected' | 'error' }> = ({ isActive, mode, status }) => {
  const color = mode === 'sam' ? 'orange' : 'sky';
  return (
    <div className="relative flex items-center justify-center h-[500px]">
      {/* Outer Glows */}
      <div className={`absolute w-[500px] h-[500px] bg-${color}-500/10 rounded-full blur-[120px] transition-all duration-1000 ${isActive ? 'scale-150 opacity-60' : 'scale-100 opacity-20'}`}></div>
      
      {/* Core Container */}
      <div className={`relative w-80 h-80 md:w-96 md:h-96 bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl border transition-all duration-700 flex flex-col items-center justify-center p-12 overflow-hidden ${isActive ? `border-${color}-500 ring-[12px] ring-${color}-500/5` : 'border-slate-200 dark:border-white/5'}`}>
        
        {/* Animated Background Grids */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Connection Status Bar */}
        <div className={`absolute top-0 left-0 w-full h-2 transition-all duration-500 ${status === 'connected' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : status === 'connecting' ? 'bg-sky-500 animate-pulse' : 'bg-transparent'}`}></div>
        
        {/* Pulse Waves */}
        <div className="absolute bottom-12 flex gap-2 items-end h-16">
          {[...Array(16)].map((_, i) => (
            <div key={i} className={`w-2.5 rounded-full transition-all duration-300 ${isActive ? `bg-${color}-500 animate-wave-dynamic` : 'bg-slate-100 dark:bg-slate-800'}`} style={{ animationDelay: `${i * 0.05}s`, height: isActive ? '100%' : '6px' }}></div>
          ))}
        </div>

        {/* Icon Hub */}
        <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 relative group ${isActive ? `bg-${color}-600 scale-110 shadow-2xl` : 'bg-slate-50 dark:bg-slate-800/50'}`}>
            {status === 'error' ? (
                <ExclamationTriangleIcon className="w-14 h-14 text-red-500 animate-pulse" />
            ) : mode === 'sam' ? (
                <FireIcon className={`w-14 h-14 transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`} />
            ) : (
                <CpuChipIcon className={`w-14 h-14 transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`} />
            )}
        </div>

        <div className="mt-10 text-center z-10">
          <p className={`text-[12px] font-black uppercase tracking-[0.5em] mb-2 ${isActive ? `text-${color}-600` : status === 'error' ? 'text-red-500' : 'text-slate-400'}`}>
            {status === 'error' ? 'CORE OFFLINE' : status === 'connecting' ? 'INITIALIZING...' : isActive ? `DISPATCH ACTIVE` : 'STANDBY MODE'}
          </p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            {isActive ? (mode === 'chloe' ? 'Chloe AI' : 'Sam Emergency') : 'ServiceVoice GTA'}
          </h4>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-2">Node: Toronto-Central-01</p>
        </div>
      </div>
    </div>
  );
};

const InfrastructureMap: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const nodes = [
    { id: 'North York', x: '52%', y: '45%' },
    { id: 'Etobicoke', x: '42%', y: '58%' },
    { id: 'Scarborough', x: '65%', y: '50%' },
    { id: 'Downtown', x: '50%', y: '65%' },
    { id: 'Mississauga East', x: '35%', y: '65%' },
    { id: 'Markham Hub', x: '60%', y: '35%' }
  ];

  return (
    <div className="relative w-full h-[600px] bg-slate-900 rounded-[4rem] border border-white/5 overflow-hidden shadow-3xl">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="absolute top-12 left-12 text-left z-20">
        <h4 className="text-3xl font-black tracking-tighter text-white uppercase italic">GTA AI MESH</h4>
        <div className="flex items-center gap-3 mt-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Strength: 99.98%</p>
        </div>
      </div>

      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
        <path d="M 300 400 Q 500 300 700 400" stroke="rgba(2, 132, 199, 0.5)" strokeWidth="2" fill="none" strokeDasharray="10,10" className="animate-pulse" />
        <path d="M 400 300 Q 500 500 600 350" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="2" fill="none" strokeDasharray="5,5" />
      </svg>

      {nodes.map((node) => (
        <div key={node.id} className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style={{ left: node.x, top: node.y }} onMouseEnter={() => setActiveNode(node.id)} onMouseLeave={() => setActiveNode(null)}>
          <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.2)] ${activeNode === node.id ? 'bg-sky-500 border-white scale-150' : 'bg-white/10 border-white/20'}`}></div>
          <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/10 p-3 rounded-2xl transition-all duration-500 pointer-events-none ${activeNode === node.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <span className="text-[10px] font-black text-white uppercase whitespace-nowrap tracking-widest">{node.id} Active Agent</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [activePersona, setActivePersona] = useState<'chloe' | 'sam'>('chloe');
  const [lastLead, setLastLead] = useState<any>(null);
  
  // Lead Feed
  const [leads, setLeads] = useState<any[]>([]);

  // Demo Form
  const [demoForm, setDemoForm] = useState({ name: '', company: '', phone: '' });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatType, setChatType] = useState<'growth' | 'ops' | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

  const sessionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const outCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const startVoiceSession = async () => {
    if (isVoiceActive) { stopVoiceSession(); return; }
    setVoiceStatus('connecting');
    playChime(activePersona === 'sam' ? 'emergency' : 'sales');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const tool_submit_lead: FunctionDeclaration = {
        name: 'submit_lead',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING },
            summary: { type: Type.STRING },
            emergency: { type: Type.BOOLEAN },
            heatingType: { type: Type.STRING, description: "Electric, Gas, or Oil" }
          },
          required: ['name', 'phone', 'summary']
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setVoiceStatus('connected');
            const source = audioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtxRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'submit_lead') {
                  const data = { ...fc.args, timestamp: new Date().toLocaleTimeString(), persona: activePersona };
                  setLeads(prev => [data, ...prev].slice(0, 5));
                  setLastLead(data);
                  
                  // Webhook hit
                  fetch(WEBHOOK_URL, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    mode: 'no-cors'
                  });

                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { status: "dispatched", tracking_id: Math.random().toString(36).substr(2, 9) } }
                  }));
                }
              }
            }
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outCtxRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtxRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outCtxRef.current, 24000, 1);
              const source = outCtxRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtxRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: () => setVoiceStatus('error'),
          onclose: () => { setIsVoiceActive(false); setVoiceStatus('idle'); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [tool_submit_lead] }],
          systemInstruction: `You are part of the ServiceVoice GTA platform. 
          Current Persona: ${activePersona === 'chloe' ? 'Chloe (Sales/Front-Desk)' : 'Sam (Emergency Specialist)'}.
          Context: Toronto/GTA HVAC market.
          Chloe: Friendly, patient, focuses on the Home Renovation Savings (HRS) program ($7500 rebates).
          Sam: Authoritative, calm, handles gas smells, no-heat calls, 4-hour guarantee.
          Rule: If "gas smell" is mentioned, tell them to hang up, call 911, then call back.
          Goal: Collect Name, Phone, and Heating Type. Execute submit_lead when you have the details.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setVoiceStatus('error');
    }
  };

  const stopVoiceSession = () => {
    setIsVoiceActive(false);
    if (sessionRef.current) sessionRef.current.close();
    if (audioCtxRef.current) audioCtxRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    setVoiceStatus('idle');
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitting(true);
    setTimeout(() => {
        setIsFormSubmitting(false);
        setIsFormSubmitted(true);
    }, 1200);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMsg,
            config: { systemInstruction: `You are a high-level HVAC SaaS Strategist helping a fleet owner in Toronto with ${chatType === 'growth' ? 'revenue growth' : 'operational efficiency'}.` }
        });
        setMessages(prev => [...prev, { role: 'ai', text: response.text || "Dispatch busy." }]);
        playChime('support');
    } catch (err) {
        setMessages(prev => [...prev, { role: 'ai', text: "Connection drop." }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-sky-500/30">
      
      {/* Premium Navbar */}
      <nav className="fixed top-0 w-full z-[100] border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-24 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-transform group-hover:rotate-12">
              <BoltIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none italic">ServiceVoice <span className="text-sky-600">GTA</span></h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Ontario Infrastructure</p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-12">
            {['Capabilities', 'Intelligence', 'Fleet Pricing'].map(link => (
                <a key={link} href="#" className="text-[12px] font-black uppercase tracking-[0.2em] hover:text-sky-600 transition-colors">{link}</a>
            ))}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-500" /> : <MoonIcon className="w-6 h-6 text-slate-600" />}
            </button>
            <button className="bg-sky-600 text-white px-10 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-sky-500 hover:shadow-2xl hover:shadow-sky-500/20 transition-all active:scale-95">Book Fleet Demo</button>
          </div>
        </div>
      </nav>

      {/* Hero Section - The Apex of HVAC SaaS */}
      <main className="relative pt-48 pb-32 px-8 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-2.5 rounded-full mb-12 backdrop-blur-md">
            <SignalIcon className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Toronto Dispatch Network Active</span>
          </div>

          <h2 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] uppercase mb-12 italic">
            Voice AI For <br/>
            <span className="text-sky-600 text-shadow-glow">GTA HVAC Leaders.</span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-bold max-w-4xl mx-auto leading-relaxed mb-16">
            Eliminate missed calls. Automate $7,500 HRS rebate qualifiers. <br className="hidden md:block" /> 
            Engineer your reception with 2026-grade dispatch intelligence.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <button onClick={startVoiceSession} className={`group relative overflow-hidden px-16 py-8 rounded-[2.5rem] font-black text-2xl tracking-tighter shadow-3xl transition-all active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                <div className="relative z-10 flex items-center gap-4">
                    {isVoiceActive ? 'DISCONNECT SYSTEM' : 'TRIGGER AI CORE'}
                    <MicrophoneIcon className={`w-8 h-8 ${isVoiceActive ? 'animate-pulse' : ''}`} />
                </div>
                {!isVoiceActive && <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            </button>
            <a href="#leads" className="bg-white/5 border border-slate-200 dark:border-white/10 px-16 py-8 rounded-[2.5rem] font-black text-2xl tracking-tighter hover:bg-white/10 transition-all backdrop-blur-xl">VIEW FLEET DATA</a>
          </div>
        </div>
      </main>

      {/* Command Center - Persona & Lead Sync */}
      <section className="py-32 px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-start">
        <div className="space-y-16">
          <div className="space-y-6">
            <h3 className="text-5xl font-black tracking-tighter uppercase italic">Persona Mesh</h3>
            <p className="text-xl text-slate-500 font-bold">Instantly toggle your agency's behavioral logic for different call flows.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <button onClick={() => setActivePersona('chloe')} className={`group p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden ${activePersona === 'chloe' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/10' : 'border-slate-200 dark:border-white/5 hover:border-slate-400'}`}>
              <CpuChipIcon className={`w-12 h-12 mb-6 transition-colors ${activePersona === 'chloe' ? 'text-sky-600' : 'text-slate-400'}`} />
              <h4 className="text-2xl font-black tracking-tight mb-2">CHLOE</h4>
              <p className="text-sm font-bold opacity-60">Sales & Rebates specialist. Maximizes $7.5k HRS conversions.</p>
              {activePersona === 'chloe' && <div className="absolute top-6 right-6 w-3 h-3 bg-sky-600 rounded-full animate-ping"></div>}
            </button>

            <button onClick={() => setActivePersona('sam')} className={`group p-10 rounded-[3rem] border-2 text-left transition-all duration-500 relative overflow-hidden ${activePersona === 'sam' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-200 dark:border-white/5 hover:border-slate-400'}`}>
              <FireIcon className={`w-12 h-12 mb-6 transition-colors ${activePersona === 'sam' ? 'text-orange-600' : 'text-slate-400'}`} />
              <h4 className="text-2xl font-black tracking-tight mb-2">SAM</h4>
              <p className="text-sm font-bold opacity-60">Emergency Dispatch. Handles gas smells & 4h responses.</p>
              {activePersona === 'sam' && <div className="absolute top-6 right-6 w-3 h-3 bg-orange-600 rounded-full animate-ping"></div>}
            </button>
          </div>

          <div id="leads" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3.5rem] p-12 shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center mb-10">
                <h4 className="text-xl font-black tracking-widest uppercase italic">Live Lead Feed</h4>
                <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="text-[10px] font-black text-green-500 uppercase">Real-time Stream</span>
                </div>
            </div>
            
            {leads.length === 0 ? (
                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                    <ChartBarIcon className="w-12 h-12" />
                    <p className="text-sm font-black uppercase tracking-widest">Awaiting Voice Conversion</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {leads.map((lead, idx) => (
                        <div key={idx} className="flex items-center gap-6 p-6 bg-slate-100 dark:bg-white/5 rounded-3xl animate-in slide-in-from-bottom-4 duration-500">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${lead.persona === 'sam' ? 'bg-orange-500' : 'bg-sky-500'}`}>
                                {lead.persona === 'sam' ? <ExclamationTriangleIcon className="w-6 h-6 text-white" /> : <UserIcon className="w-6 h-6 text-white" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between"><p className="font-black text-lg leading-none">{lead.name}</p><span className="text-[10px] opacity-40 font-bold">{lead.timestamp}</span></div>
                                <p className="text-xs font-bold opacity-60 mt-2 truncate max-w-[200px]">{lead.summary}</p>
                            </div>
                            <div className="text-right"><p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Dispatched</p></div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-32">
            <FuturisticOrb isActive={isVoiceActive} mode={activePersona} status={voiceStatus} />
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="py-32 px-8 bg-white dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto space-y-24 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
                <h3 className="text-5xl font-black tracking-tighter uppercase italic">Regional Intelligence</h3>
                <p className="text-xl text-slate-500 font-bold italic">Dedicated Toronto cloud infrastructure ensures &lt;100ms response latency for your customers.</p>
            </div>
            <InfrastructureMap />
        </div>
      </section>

      {/* Deployment Form */}
      <section className="py-32 px-8 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-600/10 blur-[150px] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
                <h3 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">Claim Your <br/><span className="text-sky-500">Fleet Territory.</span></h3>
                <p className="text-xl text-slate-400 font-bold leading-relaxed italic">ServiceVoice only partners with 3 fleets per major GTA city to maintain market dominance for our clients.</p>
                
                <div className="space-y-6">
                    {[
                        "Toronto Central / North York",
                        "Mississauga / Oakville",
                        "Brampton / Vaughan",
                        "Scarborough / Markham"
                    ].map(area => (
                        <div key={area} className="flex items-center gap-4 text-white/60">
                            <CheckCircleIcon className="w-6 h-6 text-sky-500" />
                            <span className="font-black text-sm uppercase tracking-widest">{area} Status: Limited</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card rounded-[3.5rem] p-12 md:p-16 border-white/10 shadow-3xl relative z-10">
                {isFormSubmitted ? (
                    <div className="text-center space-y-8 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl rotate-12">
                            <CheckIcon className="w-12 h-12 text-white" />
                        </div>
                        <h4 className="text-3xl font-black text-white uppercase italic">Onboarding Locked</h4>
                        <p className="text-slate-400 font-bold italic">A Senior Growth Partner will call your dispatch line within 60 minutes.</p>
                    </div>
                ) : (
                    <form onSubmit={handleDemoSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-500">Fleet Owner Name</label>
                            <input required type="text" placeholder="e.g. Michael Rossi" value={demoForm.name} onChange={e => setDemoForm({...demoForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white focus:outline-none focus:border-sky-500 transition-all font-bold" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-500">HVAC Company Name</label>
                            <input required type="text" placeholder="e.g. North York Comfort" value={demoForm.company} onChange={e => setDemoForm({...demoForm, company: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white focus:outline-none focus:border-sky-500 transition-all font-bold" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-500">GTA Dispatch Phone</label>
                            <input required type="tel" placeholder="(416) 000-0000" value={demoForm.phone} onChange={e => setDemoForm({...demoForm, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white focus:outline-none focus:border-sky-500 transition-all font-bold" />
                        </div>
                        <button type="submit" disabled={isFormSubmitting} className="w-full bg-sky-600 py-7 rounded-[2rem] font-black text-xl uppercase tracking-widest text-white shadow-2xl hover:bg-sky-500 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                            {isFormSubmitting ? <ArrowPathIcon className="w-8 h-8 animate-spin" /> : <>DEPOSIT FLEET LOCK <ArrowRightIcon className="w-6 h-6" /></>}
                        </button>
                    </form>
                )}
            </div>
        </div>
      </section>

      {/* 2026 Footer */}
      <footer className="py-24 px-8 border-t border-slate-200 dark:border-white/5 text-center">
        <div className="max-w-7xl mx-auto opacity-40 hover:opacity-100 transition-opacity">
            <p className="text-[12px] font-black uppercase tracking-[1em] mb-4">© 2026 ServiceVoice Technologies Inc.</p>
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Encrypted GTA Infrastructure • Node Toronto-101 • Distributed Ledger Verified</p>
        </div>
      </footer>

      {/* Conversational Support Hub */}
      <div className="fixed bottom-12 right-12 z-[200] flex flex-col items-end gap-6">
        {isChatOpen && (
            <div className="w-[420px] h-[650px] bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-4xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
                <div className={`p-8 text-white flex justify-between items-center transition-colors duration-700 ${!chatType ? 'bg-slate-900' : 'bg-sky-600'}`}>
                    <div>
                        <h5 className="text-xl font-black tracking-tighter uppercase italic">{!chatType ? 'System Support' : 'Growth Strategist'}</h5>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">AI Protocol Active</span>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><XMarkIcon className="w-6 h-6" /></button>
                </div>

                {!chatType ? (
                    <div className="flex-1 p-10 flex flex-col justify-center gap-8">
                        <button onClick={() => setChatType('growth')} className="group bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 p-8 rounded-[2.5rem] text-left transition-all hover:border-sky-500 hover:scale-105">
                            <ChartBarIcon className="w-10 h-10 text-sky-600 mb-4" />
                            <h6 className="font-black text-lg uppercase tracking-tight italic">Fleet Growth</h6>
                            <p className="text-xs font-bold opacity-60">Revenue & ROI analysis.</p>
                        </button>
                        <button onClick={() => setChatType('ops')} className="group bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 p-8 rounded-[2.5rem] text-left transition-all hover:border-orange-500 hover:scale-105">
                            <CpuChipIcon className="w-10 h-10 text-orange-600 mb-4" />
                            <h6 className="font-black text-lg uppercase tracking-tight italic">Operations Sync</h6>
                            <p className="text-xs font-bold opacity-60">Jobber/ServiceTitan Logic.</p>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm font-bold shadow-xl ${m.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5'}`}>{m.text}</div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChat} className="p-8 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex gap-4">
                            <input type="text" placeholder="Describe your fleet goal..." value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:outline-none italic" />
                            <button type="submit" className="bg-sky-600 text-white p-5 rounded-2xl shadow-xl hover:bg-sky-500 active:scale-95 transition-all"><PaperAirplaneIcon className="w-6 h-6" /></button>
                        </form>
                    </>
                )}
            </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-4xl transition-all duration-500 hover:scale-110 active:scale-90 ${isChatOpen ? 'bg-white text-slate-900 rotate-90' : 'bg-sky-600 text-white shadow-sky-500/40'}`}>
            {isChatOpen ? <XMarkIcon className="w-10 h-10" /> : <ChatBubbleLeftRightIcon className="w-10 h-10" />}
        </button>
      </div>

    </div>
  );
};

// Sub-component for icons
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export default App;
