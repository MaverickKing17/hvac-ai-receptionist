
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  BoltIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
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
  CpuChipIcon,
  IdentificationIcon,
  CubeIcon,
  LockClosedIcon,
  HashtagIcon,
  // Fix: Add missing GlobeAltIcon import
  GlobeAltIcon
} from '@heroicons/react/24/solid';

// --- Constants ---
// Fix: Define missing WEBHOOK_URL constant from project requirements
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwhfqnUN4rTpJeQED9TBNphEOhkUxsBZrUIPL5Wvwxm/dev";

// --- Web3 / DID Mock Helper ---
const MOCK_DID = "did:gta:hvac:0x71C765...661";

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

// --- Sub-Components ---

const NeuralOrb: React.FC<{ isActive: boolean; mode: 'chloe' | 'sam'; status: 'idle' | 'connecting' | 'connected' | 'error' }> = ({ isActive, mode, status }) => {
  const color = mode === 'sam' ? 'orange' : 'sky';
  return (
    <div className="relative flex items-center justify-center h-[550px] group">
      {/* Dynamic Background Aura */}
      <div className={`absolute w-[600px] h-[600px] bg-${color}-500/10 rounded-full blur-[140px] transition-all duration-1000 ${isActive ? 'scale-150 opacity-70 rotate-45' : 'scale-100 opacity-20'}`}></div>
      
      {/* Central Module */}
      <div className={`relative w-80 h-80 md:w-[400px] md:h-[400px] bg-white dark:bg-[#0f172a] rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] border transition-all duration-700 flex flex-col items-center justify-center p-14 overflow-hidden ${isActive ? `border-${color}-500/50 ring-[15px] ring-${color}-500/5` : 'border-slate-200 dark:border-white/5'}`}>
        
        {/* Web3 Verified Badge (Simulated) */}
        <div className="absolute top-10 right-10 flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
            <ShieldCheckIcon className="w-3 h-3 text-green-500" />
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">DID Verified</span>
        </div>

        {/* Status Scanner Line */}
        <div className={`absolute top-0 left-0 w-full h-[3px] transition-all duration-500 ${status === 'connected' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' : status === 'error' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,44,44,0.8)]' : status === 'connecting' ? 'bg-sky-500 animate-pulse' : 'bg-transparent'}`}></div>
        
        {/* Neural Waveform Visualization */}
        <div className="absolute inset-x-12 bottom-16 flex gap-2 items-end h-20">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${isActive ? `bg-${color}-500 animate-wave-dynamic` : 'bg-slate-100 dark:bg-slate-800'}`} style={{ animationDelay: `${i * 0.04}s`, height: isActive ? '100%' : '8px' }}></div>
          ))}
        </div>

        {/* Identity Core */}
        <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center transition-all duration-700 relative z-20 ${isActive ? `bg-${color}-600 scale-110 shadow-3xl` : 'bg-slate-50 dark:bg-slate-800/50'}`}>
            {status === 'error' ? (
                <ExclamationTriangleIcon className="w-16 h-16 text-red-500 animate-pulse" />
            ) : mode === 'sam' ? (
                <FireIcon className={`w-16 h-16 transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`} />
            ) : (
                <CpuChipIcon className={`w-16 h-16 transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`} />
            )}
        </div>

        <div className="mt-12 text-center z-10">
          <p className={`text-[13px] font-black uppercase tracking-[0.6em] mb-3 ${isActive ? `text-${color}-600` : status === 'error' ? 'text-red-500' : 'text-slate-400'}`}>
            {status === 'error' ? 'SYNC ERROR' : status === 'connecting' ? 'SYNCING NEURONS...' : isActive ? `AGENT STREAMING` : 'IDLE PROTOCOL'}
          </p>
          <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic">
            {isActive ? (mode === 'chloe' ? 'Chloe.v2' : 'Sam.v2') : 'ServiceVoice'}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-3 flex items-center justify-center gap-2">
            <MapPinIcon className="w-3 h-3" /> GTA Node 416-X
          </p>
        </div>
      </div>
    </div>
  );
};

const BlockchainLedger: React.FC<{ leads: any[] }> = ({ leads }) => {
  return (
    <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 shadow-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(2,132,199,0.15),transparent)]"></div>
        <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <CubeIcon className="w-6 h-6 text-sky-500" />
                    <h4 className="text-lg font-black tracking-widest uppercase italic text-white">Verified Dispatch Ledger</h4>
                </div>
                <div className="text-[10px] font-black text-sky-500/60 uppercase tracking-tighter">Chain: GTA-Mainnet</div>
            </div>

            {leads.length === 0 ? (
                <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4 text-white">
                    <HashtagIcon className="w-12 h-12" />
                    <p className="text-xs font-black uppercase tracking-widest italic">Awaiting On-Chain Event</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {leads.map((lead, idx) => (
                        <div key={idx} className="p-6 bg-white/5 border border-white/5 rounded-3xl animate-in slide-in-from-right-8 duration-500 hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-white font-black text-lg">{lead.name}</p>
                                    <p className="text-[10px] font-mono text-sky-500/70 truncate w-48">{lead.txHash || `0x${Math.random().toString(16).slice(2, 40)}`}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${lead.persona === 'sam' ? 'bg-orange-500/20 text-orange-400' : 'bg-sky-500/20 text-sky-400'}`}>
                                    {lead.persona === 'sam' ? 'Emergency' : 'Sales'}
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 font-bold mb-3 italic">"{lead.summary}"</p>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-green-500">Confirmed</span>
                                <span className="opacity-40">{lead.timestamp}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [activePersona, setActivePersona] = useState<'chloe' | 'sam'>('chloe');
  const [isDidConnecting, setIsDidConnecting] = useState(false);
  const [isDidVerified, setIsDidVerified] = useState(false);
  
  // Real-time Lead Ledger
  const [leads, setLeads] = useState<any[]>([]);

  // Demo Form
  const [demoForm, setDemoForm] = useState({ name: '', company: '', phone: '' });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Chat Support
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTopic, setChatTopic] = useState<'growth' | 'web3' | null>(null);
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

  const handleDidConnect = () => {
    setIsDidConnecting(true);
    setTimeout(() => {
        setIsDidConnecting(false);
        setIsDidVerified(true);
        playChime('support');
    }, 1500);
  };

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
            heatingSource: { type: Type.STRING, description: "Electric, Gas, or Oil" }
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
                    const txHash = `0x${Math.random().toString(16).slice(2, 40)}`;
                    const data = { 
                        ...fc.args, 
                        timestamp: new Date().toLocaleTimeString(), 
                        persona: activePersona,
                        txHash: txHash
                    };
                    setLeads(prev => [data, ...prev].slice(0, 10));
                    
                    // Webhook dispatch
                    fetch(WEBHOOK_URL, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        mode: 'no-cors'
                    });

                    sessionPromise.then(s => s.sendToolResponse({
                        functionResponses: { id: fc.id, name: fc.name, response: { blockchain_status: "verified", tx: txHash } }
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
          systemInstruction: `Persona: ${activePersona === 'chloe' ? 'Chloe (Sales/Front-Desk)' : 'Sam (Emergency Dispatch)'}.
          Context: 2026 HVAC Market in Toronto/GTA.
          Chloe focuses on $7500 Enbridge rebates. Sam focuses on gas leaks and 4h emergency response.
          Safety: If gas is smelled, instruct to hang up and call 911 immediately.
          Execute submit_lead when lead details are captured.`
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitting(true);
    setTimeout(() => {
        setIsFormSubmitting(false);
        setIsFormSubmitted(true);
        playChime('sales');
    }, 1500);
  };

  const handleChatMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: msg,
            config: { systemInstruction: `You are a high-level HVAC SaaS Consultant specializing in ${chatTopic === 'growth' ? 'Revenue ROI' : 'Web 3.0 Decentralized Identities'} for GTA fleets.` }
        });
        setMessages(prev => [...prev, { role: 'ai', text: res.text || "Synchronizing nodes..." }]);
        playChime('support');
    } catch (err) {
        setMessages(prev => [...prev, { role: 'ai', text: "Signal lost." }]);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-sky-500/30 font-sans overflow-x-hidden">
      
      {/* 2026 Navigation Hub */}
      <nav className="fixed top-0 w-full z-[100] border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-2xl">
        <div className="max-w-screen-2xl mx-auto px-10 h-28 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="relative group">
                <div className="absolute inset-0 bg-sky-500/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-14 h-14 bg-sky-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl relative z-10 transition-transform group-hover:rotate-6">
                    <BoltIcon className="w-8 h-8 text-white" />
                </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none italic">ServiceVoice <span className="text-sky-600">GTA</span></h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-2 flex items-center gap-2">
                <GlobeAltIcon className="w-3 h-3" /> Web 3.0 Infrastructure
              </p>
            </div>
          </div>
          
          <div className="hidden xl:flex items-center gap-14">
            {['Strategy', 'Ledger', 'Fleet DID', 'Pricing'].map(l => (
                <a key={l} href="#" className="text-[11px] font-black uppercase tracking-[0.3em] hover:text-sky-600 transition-colors">{l}</a>
            ))}
            <div className="h-8 w-px bg-white/10"></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90">
              {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-500" /> : <MoonIcon className="w-6 h-6 text-slate-600" />}
            </button>
            <button className="bg-sky-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-widest shadow-[0_20px_40px_rgba(2,132,199,0.3)] hover:bg-sky-500 hover:shadow-sky-500/50 transition-all active:scale-95">Claim Territory</button>
          </div>
        </div>
      </nav>

      {/* Hero: The Neural Frontline */}
      <header className="relative pt-60 pb-40 px-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-screen-2xl h-full pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-0 right-[-100px] w-[900px] h-[900px] bg-sky-500/10 blur-[150px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-200px] left-[-100px] w-[700px] h-[700px] bg-orange-500/5 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-8 py-3 rounded-full mb-16 backdrop-blur-3xl group cursor-help">
            <SignalIcon className="w-5 h-5 text-green-500 animate-pulse" />
            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">GTA Core Grid Operational</span>
            <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]"></div>
          </div>

          <h2 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-[0.8] uppercase mb-14 italic text-slate-900 dark:text-white">
            2026 Voice <br/>
            <span className="text-sky-600 drop-shadow-[0_0_30px_rgba(2,132,199,0.3)]">AI Mastery.</span>
          </h2>

          <p className="text-xl md:text-3xl text-slate-500 dark:text-slate-400 font-bold max-w-5xl mx-auto leading-tight mb-20 italic">
            Automate Toronto reception. Verify fleet identities on-chain. <br className="hidden lg:block" /> 
            Convert Enbridge rebates while your trucks are en route.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            <button onClick={startVoiceSession} className={`group relative overflow-hidden px-20 py-10 rounded-[3rem] font-black text-3xl tracking-tighter shadow-4xl transition-all active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                <div className="relative z-10 flex items-center gap-6">
                    {isVoiceActive ? 'SUSPEND AGENT' : 'SYNC VOICE CORE'}
                    <MicrophoneIcon className={`w-10 h-10 ${isVoiceActive ? 'animate-pulse' : ''}`} />
                </div>
                {!isVoiceActive && <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            </button>
            <div className="flex flex-col items-center">
                <button className="bg-white/5 border border-slate-200 dark:border-white/10 px-16 py-10 rounded-[3rem] font-black text-2xl tracking-tighter hover:bg-white/10 transition-all backdrop-blur-2xl">VETTED FLEETS</button>
                <span className="text-[9px] font-black text-sky-500 mt-4 uppercase tracking-[0.5em]">Open Ledger Protocol</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid: Market Dominance */}
      <section className="py-40 px-10 max-w-screen-2xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Main Persona Bento */}
          <div className="lg:col-span-2 bg-slate-50 dark:bg-white/5 rounded-[4rem] p-16 border border-slate-100 dark:border-white/5 shadow-2xl space-y-16">
            <div className="space-y-6">
                <h3 className="text-5xl font-black tracking-tighter uppercase italic">Persona Protocol</h3>
                <p className="text-xl text-slate-500 font-bold italic">Dynamic logic injection based on caller intent.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <button onClick={() => setActivePersona('chloe')} className={`p-10 rounded-[3.5rem] border-2 text-left transition-all duration-700 relative overflow-hidden ${activePersona === 'chloe' ? 'border-sky-500 bg-white dark:bg-sky-500/10' : 'border-transparent bg-white/5'}`}>
                    <CpuChipIcon className={`w-14 h-14 mb-8 ${activePersona === 'chloe' ? 'text-sky-600' : 'text-slate-500'}`} />
                    <h4 className="text-3xl font-black tracking-tighter mb-3 uppercase italic text-slate-900 dark:text-white">Chloe.v2</h4>
                    <p className="text-sm font-bold opacity-60 leading-relaxed italic">The Growth Engine. Specializes in $7.5k rebate pre-qual and new install bookings.</p>
                    {activePersona === 'chloe' && <div className="absolute bottom-10 right-10 w-4 h-4 bg-sky-600 rounded-full animate-ping"></div>}
                </button>

                <button onClick={() => setActivePersona('sam')} className={`p-10 rounded-[3.5rem] border-2 text-left transition-all duration-700 relative overflow-hidden ${activePersona === 'sam' ? 'border-orange-500 bg-white dark:bg-orange-500/10' : 'border-transparent bg-white/5'}`}>
                    <FireIcon className={`w-14 h-14 mb-8 ${activePersona === 'sam' ? 'text-orange-600' : 'text-slate-500'}`} />
                    <h4 className="text-3xl font-black tracking-tighter mb-3 uppercase italic text-slate-900 dark:text-white">Sam.v2</h4>
                    <p className="text-sm font-bold opacity-60 leading-relaxed italic">Emergency Specialist. 4-hour response logistics and 911-safe gas protocols.</p>
                    {activePersona === 'sam' && <div className="absolute bottom-10 right-10 w-4 h-4 bg-orange-600 rounded-full animate-ping"></div>}
                </button>
            </div>
          </div>

          {/* Web3 Sidebar / Orbital Bento */}
          <div className="lg:col-span-1 space-y-10">
            <div className="bg-sky-600 rounded-[4rem] p-12 text-white shadow-3xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <h4 className="text-2xl font-black uppercase tracking-tighter italic mb-4">NFT Fleet Badging</h4>
                <p className="text-sm font-bold italic opacity-80 leading-snug mb-8">ServiceVoice verified fleets receive a non-transferable NFT badge for consumer trust.</p>
                <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] border border-white/20 flex items-center justify-center mx-auto transition-transform group-hover:scale-110 group-hover:rotate-12">
                    <IdentificationIcon className="w-16 h-16" />
                </div>
            </div>
            
            <BlockchainLedger leads={leads} />
          </div>

        </div>
      </section>

      {/* Neural Core Demo Area */}
      <section className="py-40 px-10 bg-slate-50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-20">
            <div className="text-center space-y-6">
                <h3 className="text-6xl font-black tracking-tighter uppercase italic">The Neural Center</h3>
                <p className="text-2xl text-slate-500 font-bold italic">Experience <span className="text-sky-600">low-latency</span> voice synchronization.</p>
            </div>
            <NeuralOrb isActive={isVoiceActive} mode={activePersona} status={voiceStatus} />
        </div>
      </section>

      {/* Web 3.0 Identity & Onboarding */}
      <section className="py-40 px-10 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(2,132,199,0.1),transparent)]"></div>
        <div className="max-w-7xl mx-auto grid xl:grid-cols-2 gap-32 items-center">
            <div className="space-y-14">
                <h3 className="text-7xl font-black text-white tracking-tighter italic uppercase leading-[0.85]">Onboard <br/><span className="text-sky-500">Securely.</span></h3>
                <p className="text-2xl text-slate-400 font-bold italic leading-relaxed">ServiceVoice 2026 utilizes Decentralized Identity (DID) to verify fleet owners and protect sensitive customer data on the GTA-Mesh.</p>
                
                <div className="space-y-8">
                    <div className="flex items-center gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                        <LockClosedIcon className="w-10 h-10 text-sky-500" />
                        <div>
                            <p className="text-white font-black uppercase tracking-widest text-lg italic">Self-Sovereign Data</p>
                            <p className="text-slate-500 text-sm font-bold italic">You own your lead data. We just process it.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                        <IdentificationIcon className="w-10 h-10 text-sky-500" />
                        <div>
                            <p className="text-white font-black uppercase tracking-widest text-lg italic">Verified Reputation</p>
                            <p className="text-slate-500 text-sm font-bold italic">Consumer trust built on immutable reviews.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] rounded-[5rem] p-16 shadow-4xl border border-slate-200 dark:border-white/5 relative z-10">
                {isFormSubmitted ? (
                    <div className="text-center space-y-10 animate-in zoom-in duration-700">
                        <div className="w-28 h-28 bg-green-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-3xl rotate-12">
                            <CheckIcon className="w-14 h-14 text-white" />
                        </div>
                        <h4 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic">Node Created</h4>
                        <p className="text-slate-500 font-bold italic">Your fleet identity is being minted. <br/>A strategist will call you shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-10">
                        {!isDidVerified ? (
                            <button type="button" onClick={handleDidConnect} disabled={isDidConnecting} className="w-full bg-slate-100 dark:bg-white/5 py-10 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center gap-4 group hover:border-sky-500/50 transition-all">
                                {isDidConnecting ? <ArrowPathIcon className="w-10 h-10 text-sky-500 animate-spin" /> : <IdentificationIcon className="w-12 h-12 text-slate-400 group-hover:text-sky-500 transition-colors" />}
                                <div className="text-center">
                                    <p className="font-black text-lg uppercase italic text-slate-900 dark:text-white">{isDidConnecting ? 'Verifying Identity...' : 'Connect Fleet DID'}</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Web 3.0 Verification Required</p>
                                </div>
                            </button>
                        ) : (
                            <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-3xl flex items-center gap-4">
                                <ShieldCheckIcon className="w-8 h-8 text-green-500" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Verified Identity</p>
                                    <p className="text-[11px] font-mono text-slate-500 truncate">{MOCK_DID}</p>
                                </div>
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-sky-600 uppercase tracking-[0.3em] ml-4">Fleet Principal Name</label>
                                <input required type="text" placeholder="John Doe" value={demoForm.name} onChange={e => setDemoForm({...demoForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl py-7 px-10 focus:outline-none focus:border-sky-500 transition-all font-bold text-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-sky-600 uppercase tracking-[0.3em] ml-4">Company (Legal Entity)</label>
                                <input required type="text" placeholder="HVAC GTA Pros Inc." value={demoForm.company} onChange={e => setDemoForm({...demoForm, company: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl py-7 px-10 focus:outline-none focus:border-sky-500 transition-all font-bold text-lg" />
                            </div>
                        </div>

                        <button type="submit" disabled={isFormSubmitting || !isDidVerified} className="w-full bg-sky-600 py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest text-white shadow-3xl hover:bg-sky-500 transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-40">
                            {isFormSubmitting ? <ArrowPathIcon className="w-10 h-10 animate-spin" /> : <>DEPOSIT FLEET LOCK <ArrowRightIcon className="w-8 h-8" /></>}
                        </button>
                    </form>
                )}
            </div>
        </div>
      </section>

      {/* 2026 Footer Infrastructure */}
      <footer className="py-32 px-10 text-center border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex justify-center gap-10">
                <GlobeAltIcon className="w-8 h-8 opacity-20" />
                <CubeIcon className="w-8 h-8 opacity-20" />
                <CpuChipIcon className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-[13px] font-black uppercase tracking-[1em] text-slate-300 dark:text-white/10">© 2026 ServiceVoice Technologies GTA</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">
                <span>Decentralized Identity Verified</span>
                <span>Node: TOR-CENTRAL-416</span>
                <span>IPFS Secure Logs</span>
                <span>Smart Contract Audited v2.4</span>
            </div>
        </div>
      </footer>

      {/* Floating Support Hub */}
      <div className="fixed bottom-12 right-12 z-[200] flex flex-col items-end gap-8">
        {isChatOpen && (
            <div className="w-[450px] h-[700px] bg-white dark:bg-[#0f172a] rounded-[4.5rem] shadow-5xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
                <div className={`p-10 text-white flex justify-between items-center transition-colors duration-700 ${!chatTopic ? 'bg-slate-900' : 'bg-sky-600 shadow-[0_15px_30px_rgba(2,132,199,0.3)]'}`}>
                    <div>
                        <h5 className="text-2xl font-black tracking-tighter uppercase italic">{!chatTopic ? 'Strategy Hub' : 'SaaS Strategist'}</h5>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Sync Protocol Active</span>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all active:scale-90"><XMarkIcon className="w-8 h-8" /></button>
                </div>

                {!chatTopic ? (
                    <div className="flex-1 p-12 flex flex-col justify-center gap-10">
                        <button onClick={() => setChatTopic('growth')} className="group bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 p-10 rounded-[3.5rem] text-left transition-all hover:border-sky-500 hover:scale-105 active:scale-95">
                            <ChartBarIcon className="w-12 h-12 text-sky-600 mb-6" />
                            <h6 className="font-black text-xl uppercase tracking-tighter italic text-slate-900 dark:text-white">Revenue ROI</h6>
                            <p className="text-xs font-bold opacity-60 leading-relaxed italic">Optimize lead conversion and Enbridge pre-qual funnels.</p>
                        </button>
                        <button onClick={() => setChatTopic('web3')} className="group bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 p-10 rounded-[3.5rem] text-left transition-all hover:border-orange-500 hover:scale-105 active:scale-95">
                            <IdentificationIcon className="w-12 h-12 text-orange-600 mb-6" />
                            <h6 className="font-black text-xl uppercase tracking-tighter italic text-slate-900 dark:text-white">Web 3.0 Logic</h6>
                            <p className="text-xs font-bold opacity-60 leading-relaxed italic">Managing your Fleet DID and blockchain reputation nodes.</p>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 p-10 overflow-y-auto space-y-8 bg-slate-50/50 dark:bg-slate-950/20">
                            <div className="flex justify-start">
                                <div className="max-w-[85%] p-8 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-[2.5rem] rounded-tl-none border border-slate-100 dark:border-white/5 text-sm font-bold shadow-xl italic">
                                    Protocol synchronized. How can I assist with your {chatTopic === 'growth' ? 'Revenue ROI' : 'Web 3.0 Fleet Identity'} today?
                                </div>
                            </div>
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-8 rounded-[2.5rem] text-sm font-bold shadow-2xl ${m.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5'} italic`}>{m.text}</div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChatMsg} className="p-10 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex gap-6">
                            <input type="text" placeholder="Message strategist..." value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl px-8 py-6 text-sm font-bold focus:outline-none italic" />
                            <button type="submit" className="bg-sky-600 text-white p-6 rounded-3xl shadow-3xl hover:bg-sky-500 active:scale-90 transition-all"><PaperAirplaneIcon className="w-7 h-7" /></button>
                        </form>
                    </>
                )}
            </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center shadow-5xl transition-all duration-700 hover:scale-110 active:scale-90 ${isChatOpen ? 'bg-white text-slate-900 rotate-90 scale-105' : 'bg-sky-600 text-white shadow-sky-500/50'}`}>
            {isChatOpen ? <XMarkIcon className="w-14 h-14" /> : <ChatBubbleLeftRightIcon className="w-14 h-14" />}
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
