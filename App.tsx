
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  CheckBadgeIcon,
  CpuChipIcon,
  ServerIcon,
  CalendarDaysIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowUpRightIcon,
  RectangleGroupIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  SparklesIcon,
  EnvelopeIcon,
  UserIcon,
  ArrowRightIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  BanknotesIcon,
  LifebuoyIcon,
  SignalIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

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

// Subtle UI Sound Synthesis
const playChime = (type: 'sales' | 'support') => {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
  masterGain.connect(ctx.destination);

  if (type === 'sales') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
    osc2.connect(g2);
    g2.connect(masterGain);
    g1.gain.setValueAtTime(0, ctx.currentTime);
    g1.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    g2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
    g2.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.08);
    osc1.stop(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.3);
  } else {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.connect(g);
    g.connect(masterGain);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }
};

const ProductOrb: React.FC<{ isActive: boolean; mode: 'chloe' | 'sam'; status: 'idle' | 'connecting' | 'connected' | 'error' }> = ({ isActive, mode, status }) => {
  const color = mode === 'sam' ? 'orange' : 'sky';
  const statusColor = status === 'error' ? 'red' : status === 'connected' ? 'green' : 'slate';
  
  return (
    <div className="relative flex items-center justify-center h-[450px]">
      <div className={`absolute inset-0 bg-${color}-500/10 blur-[100px] rounded-full transition-all duration-1000 ${isActive ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
      
      <div className={`relative w-72 h-72 md:w-80 md:h-80 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-xl border ${isActive ? `border-${color}-500 ring-4 ring-${color}-500/10` : 'border-slate-200 dark:border-white/5'} transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden`}>
        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-500 ${status === 'connected' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : status === 'connecting' ? 'bg-sky-500 animate-pulse' : 'bg-transparent'}`}></div>
        
        <div className="absolute bottom-8 flex gap-1.5">
          {[...Array(16)].map((_, i) => (
            <div key={i} className={`w-1.5 rounded-full transition-all duration-300 ${isActive ? `bg-${color}-500 animate-wave-dynamic` : 'bg-slate-200 dark:bg-slate-800'}`} style={{ animationDelay: `${i * 0.05}s`, height: isActive ? '24px' : '6px' }}></div>
          ))}
        </div>

        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-700 ${isActive ? `bg-${color}-600 scale-105 shadow-lg` : 'bg-slate-50 dark:bg-slate-800/50'}`}>
          {status === 'error' ? (
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 animate-pulse" />
          ) : (
            <MicrophoneIcon className={`w-12 h-12 ${isActive ? 'text-white' : 'text-slate-400'}`} />
          )}
        </div>
        
        <div className="mt-8 text-center">
          <p className={`text-[12px] font-bold uppercase tracking-[0.3em] mb-1 ${isActive ? `text-${color}-600` : status === 'error' ? 'text-red-500' : 'text-slate-400'}`}>
            {status === 'error' ? 'CONNECTION FAILED' : status === 'connecting' ? 'INITIALIZING...' : isActive ? `${mode.toUpperCase()} ACTIVE` : 'READY TO VOICE'}
          </p>
          <h4 className="text-lg font-bold text-slate-800 dark:text-white">
            {status === 'error' ? 'Check API_KEY' : isActive ? (mode === 'chloe' ? 'GTA Sales Hub' : 'GTA Dispatch Hub') : 'ServiceVoice AI'}
          </h4>
        </div>
      </div>
    </div>
  );
};

const GTAMap: React.FC = () => {
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const cityNodes = [
    { id: 'Toronto', x: '50%', y: '60%' }, { id: 'Mississauga', x: '40%', y: '65%' },
    { id: 'Brampton', x: '35%', y: '50%' }, { id: 'Vaughan', x: '45%', y: '40%' },
    { id: 'Markham', x: '55%', y: '40%' }, { id: 'Oakville', x: '35%', y: '75%' },
    { id: 'Richmond Hill', x: '50%', y: '35%' }, { id: 'Burlington', x: '30%', y: '80%' },
  ];
  return (
    <div className="relative w-full h-[500px] bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
      <div className="absolute bottom-0 right-0 w-[80%] h-[40%] bg-sky-500/5 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-10 left-10 z-10 space-y-2 text-left">
        <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Live GTA Coverage</h4>
        <p className="text-sm font-medium text-slate-500 max-w-xs uppercase tracking-widest">Hover over cities to view AI network status across Southern Ontario.</p>
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        {cityNodes.map((node, i) => cityNodes.slice(i + 1).map((target, j) => (
          <line key={`${i}-${j}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y} stroke="currentColor" strokeWidth="0.5" className="text-sky-500 dark:text-sky-400" />
        )))}
      </svg>
      <div className="absolute inset-0">
        {cityNodes.map((city) => (
          <div key={city.id} className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ left: city.x, top: city.y }} onMouseEnter={() => setActiveCity(city.id)} onMouseLeave={() => setActiveCity(null)}>
            <div className="absolute inset-0 w-8 h-8 -translate-x-1/4 -translate-y-1/4 bg-sky-500/20 rounded-full animate-ping pointer-events-none"></div>
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 shadow-lg ${activeCity === city.id ? 'bg-sky-500 border-white scale-150' : 'bg-white dark:bg-slate-800 border-sky-500'}`}></div>
            <div className={`absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-xl transition-all duration-300 pointer-events-none ${activeCity === city.id ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95'}`}>
              <div className="flex items-center gap-2">
                <SignalIcon className="w-3 h-3 text-green-500" />
                <span className="text-[12px] font-bold uppercase tracking-wider">{city.id}</span>
              </div>
              <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">AI Node Online</div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-10 right-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center"><GlobeAltIcon className="w-6 h-6 text-white" /></div>
          <div className="text-left">
            <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Network Status</div>
            <div className="text-sm font-bold uppercase tracking-tight">Active Coverage</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">100%</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">GTA Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">8+</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hubs Online</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [activePersona, setActivePersona] = useState<'chloe' | 'sam'>('chloe');
  const [lastLead, setLastLead] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [demoRequest, setDemoRequest] = useState({ name: '', email: '', phone: '' });

  // Chat Widget State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPersona, setChatPersona] = useState<'sales' | 'support' | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const selectPersona = (persona: 'sales' | 'support') => {
    setChatPersona(persona);
    const greeting = persona === 'sales' 
      ? "Hey there! I'm the ServiceVoice Growth Specialist. Ready to see how we can skyrocket your GTA install volume?"
      : "Hello! I'm your ServiceVoice Integration Specialist. How can I help you with platform features or technical setup today?";
    setChatMessages([{ role: 'agent', text: greeting }]);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setDemoRequest({ name: '', email: '', phone: '' });
    }, 1200);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatPersona) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAgentTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...chatMessages.map(m => (m.role === 'user' ? 'User: ' + m.text : 'Agent: ' + m.text)), 'User: ' + userMsg].join('\n'),
        config: {
          systemInstruction: chatPersona === 'sales' 
            ? 'You are a ServiceVoice Sales Strategist focusing on ROI and market dominance in the GTA.'
            : 'You are a ServiceVoice Support Specialist focusing on technical setup and integrations.',
        }
      });
      setChatMessages(prev => [...prev, { role: 'agent', text: response.text || "Technical difficulty." }]);
      playChime(chatPersona);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'agent', text: "API Key Error. Please ensure your Gemini API Key is set in Vercel." }]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  const startVoiceDemo = async () => {
    if (isVoiceActive) { stopVoiceDemo(); return; }
    setVoiceStatus('connecting');
    try {
      if (!process.env.API_KEY) {
        throw new Error("Missing API_KEY environment variable.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setVoiceStatus('connected');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'submit_lead') {
                  setLastLead(fc.args);
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "lead successfully pushed" } }
                  }));
                }
              }
            }
            const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio && outContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audio), outContextRef.current, 24000, 1);
              const source = outContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => {
            console.error("Live connection error:", e);
            setVoiceStatus('error');
            stopVoiceDemo();
          },
          onclose: () => {
            setVoiceStatus('idle');
            setIsVoiceActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [{
            name: 'submit_lead',
            parameters: {
              type: Type.OBJECT,
              properties: { name: {type: Type.STRING}, phone: {type: Type.STRING}, summary: {type: Type.STRING} },
              required: ['name', 'phone', 'summary']
            }
          }]}],
          systemInstruction: `You are ServiceVoice GTA AI. MARKET: Toronto. PERSONAS: Chloe (Sales) and Sam (Dispatch). SAFETY: Gas smell = Leave, call 911.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      setVoiceStatus('error');
      setIsVoiceActive(false);
      alert("Voice failed: Ensure API_KEY is set in Vercel environment variables.");
    }
  };

  const stopVoiceDemo = () => {
    setIsVoiceActive(false);
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    setVoiceStatus('idle');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* SaaS Nav Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-md">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">ServiceVoice <span className="text-sky-600 font-normal lowercase">GTA</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-[15px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors">Features</a>
            <a href="#pricing" className="text-[15px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors">Pricing</a>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-500" /> : <MoonIcon className="w-6 h-6 text-slate-600" />}
            </button>
            <button className="bg-sky-600 text-white px-7 py-3 rounded-xl font-bold text-[15px] shadow-sm hover:bg-sky-700 transition-all">Request Demo</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-5 py-2 rounded-full border border-sky-200 dark:border-sky-800">
            <MapPinIcon className="w-5 h-5 text-orange-500" />
            <span className="text-[12px] font-bold uppercase tracking-[0.15em]">Toronto & GTA specialized</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-5xl mx-auto">
            The Smartest <span className="text-sky-600">AI Voice</span> <br/>
            Dispatcher for GTA Contractors.
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
            ServiceVoice automates your reception, pre-qualifies Enbridge rebates, and dispatches crews across the GTA without missing a single lead.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
            <button onClick={startVoiceDemo} className={`px-10 py-5 rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-4 active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'}`}>
              {voiceStatus === 'connecting' ? 'Connecting...' : isVoiceActive ? 'Stop Demo Agent' : 'Try Demo Agent'}
              <MicrophoneIcon className="w-6 h-6" />
            </button>
            <a href="#pricing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center">View Pricing</a>
          </div>
        </div>
      </section>

      {/* Demo Hub */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="glass-card rounded-[2.5rem] p-12 border border-slate-200 dark:border-slate-800 text-left">
            <div className="space-y-8">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Persona Dispatch Modes</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Switch between Chloe and Sam to see how our AI handles sales versus emergency dispatch scenarios.</p>
              <div className="grid grid-cols-2 gap-5">
                <button onClick={() => setActivePersona('chloe')} className={`p-7 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${activePersona === 'chloe' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
                  <SunIcon className="w-8 h-8 text-sky-600" />
                  <span className="font-bold text-[13px] uppercase tracking-wider">Chloe (Rebates)</span>
                </button>
                <button onClick={() => setActivePersona('sam')} className={`p-7 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${activePersona === 'sam' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
                  <WrenchScrewdriverIcon className="w-8 h-8 text-orange-600" />
                  <span className="font-bold text-[13px] uppercase tracking-wider">Sam (Emergency)</span>
                </button>
              </div>
              {lastLead && (
                <div className="mt-8 p-7 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                  <div className="flex justify-between items-center mb-4"><span className="text-[12px] font-bold uppercase tracking-widest text-green-700">Captured Lead Data</span><CheckBadgeIcon className="w-6 h-6 text-green-600" /></div>
                  <pre className="text-sm font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap leading-normal">{JSON.stringify(lastLead, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
          <ProductOrb isActive={isVoiceActive} mode={activePersona} status={voiceStatus} />
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center"><h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Optimized for Professional Fleets</h3></div>
          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-8 glass-card rounded-[2.5rem] p-10 flex flex-col justify-between border-slate-200 dark:border-slate-800 text-left">
              <GlobeAltIcon className="w-12 h-12 text-sky-600 mb-8" />
              <div><h4 className="text-2xl font-bold mb-4">GTA Routing Logic</h4><p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Understands Toronto's unique geography and area codes to route calls to the nearest available technician.</p></div>
            </div>
            <div className="md:col-span-4 bg-sky-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-between text-left shadow-lg">
              <DevicePhoneMobileIcon className="w-12 h-12 mb-8 opacity-90" />
              <div><h4 className="text-2xl font-bold mb-4">Mobile CRM Sync</h4><p className="text-base opacity-95 font-medium leading-relaxed">Integrated with ServiceTitan & Jobber. Leads appear instantly as new jobs with full call transcriptions.</p></div>
            </div>
          </div>
          <div className="mt-20 text-center"><h4 className="text-3xl font-bold mb-12">GTA Service Coverage</h4><GTAMap /></div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20"><h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Platform Plans</h3><p className="text-xl text-slate-500 font-medium">Flexible SaaS pricing built for the Southern Ontario market.</p></div>
          <div className="grid md:grid-cols-3 gap-8">
            {CONFIG.pricing.map((tier, i) => (
              <div key={i} className={`p-10 rounded-[3rem] border-2 flex flex-col transition-all text-left ${tier.popular ? 'bg-sky-600 border-sky-500 text-white shadow-xl' : 'glass-card border-slate-200'}`}>
                <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-3 opacity-80">{tier.name}</h4>
                <div className="text-5xl font-extrabold mb-8 tracking-tight">{tier.price}</div>
                <p className={`text-lg font-medium mb-10 ${tier.popular ? 'opacity-90' : 'text-slate-600'}`}>{tier.description}</p>
                <div className="space-y-5 mb-12 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-4"><CheckBadgeIcon className={`w-6 h-6 ${tier.popular ? 'opacity-90' : 'text-sky-600'}`} /><span className="text-[15px] font-bold tracking-tight uppercase">{f}</span></div>
                  ))}
                </div>
                <button className={`w-full py-5 rounded-2xl font-bold text-lg transition-all ${tier.popular ? 'bg-white text-sky-600' : 'bg-slate-900 text-white'}`}>Deploy Agent</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-28 pb-14 px-6">
        <div className="max-w-7xl mx-auto text-left"><p className="text-[12px] font-bold uppercase tracking-[0.3em] opacity-40">© 2026 ServiceVoice Technologies GTA. Built for Ontario HVAC.</p></div>
      </footer>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-6 w-[360px] md:w-[420px] h-[550px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className={`p-6 text-white flex justify-between items-center transition-colors duration-500 ${!chatPersona ? 'bg-slate-800' : chatPersona === 'sales' ? 'bg-orange-600' : 'bg-sky-600'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {!chatPersona ? <ChatBubbleLeftRightIcon className="w-6 h-6" /> : chatPersona === 'sales' ? <BanknotesIcon className="w-6 h-6" /> : <LifebuoyIcon className="w-6 h-6" />}
                </div>
                <div><h5 className="text-base font-bold tracking-tight">{!chatPersona ? 'Choose Your AI Guide' : chatPersona === 'sales' ? 'Sales Strategist' : 'Support Specialist'}</h5><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div><span className="text-[11px] font-bold uppercase tracking-widest opacity-90">Ready to assist</span></div></div>
              </div>
              <div className="flex gap-1">
                {chatPersona && <button onClick={() => setChatPersona(null)} className="p-2 hover:bg-black/10 rounded-xl transition-all"><RectangleGroupIcon className="w-5 h-5" /></button>}
                <button onClick={() => setIsChatOpen(false)} className="p-2.5 hover:bg-black/10 rounded-xl transition-all"><XMarkIcon className="w-6 h-6" /></button>
              </div>
            </div>
            {!chatPersona ? (
              <div className="flex-1 p-8 flex flex-col justify-center gap-6 animate-in fade-in duration-500">
                <button onClick={() => selectPersona('sales')} className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl flex items-center gap-5 hover:border-orange-500 transition-all text-left">
                  <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><BanknotesIcon className="w-7 h-7 text-white" /></div>
                  <div><h6 className="font-bold text-orange-900">Growth & Sales</h6><p className="text-[13px] font-semibold text-orange-700/60">ROI, Lead Gen, & Market Dominance</p></div>
                </button>
                <button onClick={() => selectPersona('support')} className="bg-sky-50 border-2 border-sky-200 p-6 rounded-3xl flex items-center gap-5 hover:border-sky-500 transition-all text-left">
                  <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg"><LifebuoyIcon className="w-7 h-7 text-white" /></div>
                  <div><h6 className="font-bold text-sky-900">Technical Support</h6><p className="text-[13px] font-semibold text-sky-700/60">Features, Integrations, & Setup</p></div>
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-950/20">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-5 rounded-3xl text-sm font-semibold shadow-sm ${msg.role === 'user' ? (chatPersona === 'sales' ? 'bg-orange-600' : 'bg-sky-600') + ' text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-800'}`}>{msg.text}</div>
                    </div>
                  ))}
                  {isAgentTyping && <div className="flex justify-start"><div className="bg-white p-5 rounded-3xl flex gap-1.5 items-center"><div className={`w-2 h-2 rounded-full animate-bounce ${chatPersona === 'sales' ? 'bg-orange-400' : 'bg-sky-400'}`}></div><div className={`w-2 h-2 rounded-full animate-bounce delay-75 ${chatPersona === 'sales' ? 'bg-orange-400' : 'bg-sky-400'}`}></div></div></div>}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="p-5 border-t border-slate-100 flex gap-3 bg-white dark:bg-slate-900">
                  <input type="text" placeholder="Ask a question..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[15px] font-semibold focus:outline-none focus:border-slate-400" />
                  <button type="submit" className={`p-3.5 text-white rounded-2xl shadow-md ${chatPersona === 'sales' ? 'bg-orange-600' : 'bg-sky-600'}`}><PaperAirplaneIcon className="w-6 h-6" /></button>
                </form>
              </>
            )}
          </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${isChatOpen ? 'bg-white text-slate-800' : 'bg-sky-600 text-white'}`}>
          {isChatOpen ? <XMarkIcon className="w-8 h-8" /> : <ChatBubbleLeftRightIcon className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
};

export default App;
