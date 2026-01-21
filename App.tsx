
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
  MapPinIcon
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

const ProductOrb: React.FC<{ isActive: boolean; mode: 'chloe' | 'sam' }> = ({ isActive, mode }) => {
  const color = mode === 'sam' ? 'orange' : 'sky';
  return (
    <div className="relative flex items-center justify-center h-[500px]">
      <div className={`absolute inset-0 bg-${color}-500/10 blur-[120px] rounded-full animate-pulse transition-all duration-1000 ${isActive ? 'scale-150 opacity-40' : 'scale-100 opacity-20'}`}></div>
      
      <div className={`relative w-72 h-72 md:w-80 md:h-80 bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl border-4 ${isActive ? `border-${color}-500` : 'border-slate-200 dark:border-white/10'} transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden`}>
        {/* Tech decorative patterns */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50"></div>
        <div className="absolute bottom-4 flex gap-1">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`w-1 h-4 rounded-full transition-all duration-300 ${isActive ? `bg-${color}-500 animate-wave-dynamic` : 'bg-slate-200 dark:bg-slate-800'}`} style={{ animationDelay: `${i * 0.05}s` }}></div>
          ))}
        </div>

        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-inner transition-all duration-700 ${isActive ? `bg-${color}-500 shadow-${color}-500/50 scale-110` : 'bg-slate-100 dark:bg-slate-800'}`}>
          <MicrophoneIcon className={`w-12 h-12 ${isActive ? 'text-white' : 'text-slate-400'}`} />
        </div>
        
        <div className="mt-8 text-center">
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-1 ${isActive ? `text-${color}-500` : 'text-slate-400'}`}>
            {isActive ? `${mode.toUpperCase()} ACTIVE` : 'READY TO VOICE'}
          </p>
          <h4 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
            {isActive ? (mode === 'chloe' ? 'GTA Sales Hub' : 'GTA Dispatch Hub') : 'ServiceVoice AI'}
          </h4>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [activePersona, setActivePersona] = useState<'chloe' | 'sam'>('chloe');
  const [lastLead, setLastLead] = useState<any>(null);
  
  // Lead Form State
  const [demoRequest, setDemoRequest] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setDemoRequest({ name: '', email: '', phone: '' });
    }, 1500);
  };

  const startVoiceDemo = async () => {
    if (isVoiceActive) { stopVoiceDemo(); return; }
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const leadFunction: FunctionDeclaration = {
        name: 'submit_lead',
        parameters: {
          type: Type.OBJECT,
          description: 'Submit customer lead data for a GTA-based HVAC brand.',
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING },
            address: { type: Type.STRING, description: 'Service address in the GTA' },
            summary: { type: Type.STRING },
            program: { type: Type.STRING, description: 'Rebate program interest (e.g., Enbridge, HRS)' },
            persona: { type: Type.STRING, description: 'Chloe or Sam' }
          },
          required: ['name', 'phone', 'summary']
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
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
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "lead successfully pushed to GTA dispatch queue" } }
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
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [leadFunction] }],
          systemInstruction: `You are ServiceVoice GTA AI, a white-label voice solution specialized for the Toronto and Greater Toronto Area HVAC market. 
          You are demonstrating your capabilities to a local HVAC owner.
          MARKET CONTEXT:
          - Focus: Toronto (416/647) and surrounding GTA regions (905).
          - Rebates: Home Renovation Savings (HRS) program, Enbridge Gas incentives. 
          - Logic: Up to $7500 for electric-to-heat-pump, $2000 for gas hybrid.
          PERSONAS:
          - Chloe: GTA Rebate Strategist. Knowledgeable about Ontario energy audits.
          - Sam: Priority GTA Dispatcher. Covers Scarborough to Oakville. 4-hour response guarantee.
          MANDATORY SAFETY: If gas smell (Enbridge emergency), say: "Hang up, leave the house immediately, and call 911. Your safety is first."`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { alert("Mic required for GTA market demo."); }
  };

  const stopVoiceDemo = () => {
    setIsVoiceActive(false);
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500">
      {/* SaaS Nav Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center transform rotate-12 shadow-lg shadow-sky-600/20">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">ServiceVoice <span className="text-sky-600 font-medium lowercase">GTA</span></h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold uppercase tracking-widest hover:text-sky-600 transition-colors">GTA Features</a>
            <a href="#pricing" className="text-sm font-bold uppercase tracking-widest hover:text-sky-600 transition-colors">Pricing</a>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
              {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-500" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
            </button>
            <button className="bg-sky-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-sky-600/20 hover:scale-105 active:scale-95 transition-all">
              Request GTA Quote
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 px-4 py-2 rounded-full border border-sky-500/20">
            <MapPinIcon className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Toronto & GTA Market Optimized</span>
          </div>

          <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-5xl mx-auto">
            GTA HVAC.<br/>
            Fully <span className="text-sky-600">Automated.</span><br/>
            No <span className="text-orange-500">Missed Calls.</span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
            ServiceVoice is the first AI voice dispatcher built specifically for the unique demands of the Toronto market. From Enbridge rebates to 416 emergency dispatch.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={startVoiceDemo} 
              className={`px-12 py-8 rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}
            >
              {isVoiceActive ? 'Hang Up Demo' : 'Try GTA Voice Agent'}
              <MicrophoneIcon className="w-6 h-6" />
            </button>
            <a href="#request-demo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-white/10 px-12 py-8 rounded-[2.5rem] font-black text-2xl hover:bg-slate-50 transition-all flex items-center justify-center">
              Market Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Demo Hub */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="glass-card rounded-[3rem] p-12 border-sky-500/20 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <CpuChipIcon className="w-40 h-40" />
            </div>
            
            <div className="space-y-8 relative z-10">
              <h3 className="text-4xl font-black tracking-tighter">GTA Logic Modes</h3>
              <p className="text-lg text-slate-500 font-medium">Switch modes to see how ServiceVoice handles Toronto-specific scenarios like the Home Renovation Savings (HRS) program or 24/7 winter emergencies.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setActivePersona('chloe')} 
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${activePersona === 'chloe' ? 'border-sky-500 bg-sky-500/10' : 'border-slate-200 dark:border-white/10'}`}
                >
                  <SunIcon className="w-8 h-8 text-sky-600" />
                  <span className="font-black text-xs uppercase tracking-widest">Chloe (GTA Rebates)</span>
                </button>
                <button 
                  onClick={() => setActivePersona('sam')} 
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${activePersona === 'sam' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-200 dark:border-white/10'}`}
                >
                  <BoltIcon className="w-8 h-8 text-orange-600" />
                  <span className="font-black text-xs uppercase tracking-widest">Sam (GTA Dispatch)</span>
                </button>
              </div>

              {lastLead && (
                <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-3xl animate-in zoom-in duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-green-600">Lead Routed to GTA Tech</span>
                    <CheckBadgeIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <pre className="text-[10px] font-mono opacity-60 overflow-x-auto text-left">
                    {JSON.stringify(lastLead, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <ProductOrb isActive={isVoiceActive} mode={activePersona} />
        </div>
      </section>

      {/* GTA Specific Bento Grid */}
      <section id="features" className="py-20 px-6 bg-slate-100 dark:bg-white/5">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter">Toronto Market Integration</h3>
          </div>

          <div className="grid md:grid-cols-12 gap-6 h-auto">
            <div className="md:col-span-8 glass-card rounded-[3rem] p-10 flex flex-col justify-between border-sky-500/10 text-left">
              <GlobeAltIcon className="w-12 h-12 text-sky-600 mb-8" />
              <div>
                <h4 className="text-3xl font-black mb-4 tracking-tight">416 & 905 Routing</h4>
                <p className="text-lg text-slate-500 font-medium">Smart routing that understands the difference between a Mississauga service call and an Etobicoke emergency. Route leads based on your team's real-time GTA location.</p>
              </div>
            </div>
            <div className="md:col-span-4 bg-orange-600 rounded-[3rem] p-10 text-white flex flex-col justify-between text-left shadow-2xl shadow-orange-600/30">
              <BoltIcon className="w-12 h-12 mb-8" />
              <div>
                <h4 className="text-3xl font-black mb-4 tracking-tight">HRS Pre-Qual</h4>
                <p className="opacity-80 font-bold tracking-tight">AI Chloe automatically checks if GTA homeowners qualify for the $7,500 electric or $2,000 gas rebates before you ever send a tech.</p>
              </div>
            </div>
            <div className="md:col-span-12 glass-card rounded-[3rem] p-10 flex flex-col md:flex-row gap-12 items-center border-slate-200 dark:border-white/10 text-left">
              <div className="flex-1 space-y-6">
                <h4 className="text-4xl font-black tracking-tight">Enbridge Billing Ready</h4>
                <p className="text-xl text-slate-500 font-medium leading-relaxed">Our AI is pre-trained on Toronto energy billing cycles and Enbridge Gas service protocols. We talk to your customers in a language they trust.</p>
                <div className="flex gap-4">
                  {["Scarborough", "Etobicoke", "North York", "Downtown"].map((city) => (
                    <span key={city} className="bg-slate-200 dark:bg-white/5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{city}</span>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-80 h-48 bg-slate-900 rounded-[2rem] flex items-center justify-center p-8 border border-white/10">
                 <img src="https://picsum.photos/400/200?random=20" alt="Dashboard" className="rounded-xl opacity-50 grayscale" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Hub */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter">GTA Market Plans</h3>
            <p className="text-xl text-slate-500 font-bold">Simple pricing tailored for Southern Ontario fleets.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {CONFIG.pricing.map((tier, i) => (
              <div key={i} className={`p-10 rounded-[3.5rem] border-2 flex flex-col transition-all duration-500 hover:scale-[1.02] text-left ${tier.popular ? 'bg-sky-600 border-sky-500 text-white shadow-2xl shadow-sky-600/40' : 'glass-card border-slate-200 dark:border-white/10'}`}>
                <h4 className="text-xl font-black uppercase tracking-widest mb-2 opacity-80">{tier.name}</h4>
                <div className="text-5xl font-black mb-8">{tier.price}</div>
                <p className={`text-lg font-bold mb-10 ${tier.popular ? 'opacity-90' : 'text-slate-500'}`}>{tier.description}</p>
                <div className="space-y-4 mb-12 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <CheckBadgeIcon className="w-6 h-6 opacity-60" />
                      <span className="text-xs font-black tracking-widest uppercase">{f}</span>
                    </div>
                  ))}
                </div>
                <a href="#request-demo" className={`w-full py-6 rounded-3xl font-black text-xl transition-all text-center ${tier.popular ? 'bg-white text-sky-600' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                  Deploy AI Agent
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture Section */}
      <section id="request-demo" className="py-32 px-6 bg-slate-900 dark:bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100" fill="none" stroke="white" strokeWidth="0.1" />
            <path d="M0 80 C 30 20 60 20 100 80" fill="none" stroke="white" strokeWidth="0.1" />
          </svg>
        </div>
        
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <div className="space-y-4">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter italic">Dominate your GTA territory.</h3>
            <p className="text-xl opacity-60 font-medium">Get a personalized ServiceVoice setup that includes GTA rebate pre-qualification and 416/905 dispatch routing logic.</p>
          </div>

          {isSubmitted ? (
            <div className="glass-card p-12 rounded-[3rem] border-green-500/30 space-y-6 animate-in zoom-in duration-700">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/40">
                <CheckBadgeIcon className="w-12 h-12 text-white" />
              </div>
              <h4 className="text-3xl font-black tracking-tight">GTA Demo Request Received!</h4>
              <p className="text-lg opacity-70 font-bold uppercase tracking-widest">A Toronto specialist will contact you shortly.</p>
              <button onClick={() => setIsSubmitted(false)} className="text-sky-400 font-black uppercase tracking-widest text-sm hover:underline">Send another request</button>
            </div>
          ) : (
            <form onSubmit={handleDemoSubmit} className="glass-card p-8 md:p-12 rounded-[3rem] border-white/10 space-y-6 text-left">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 ml-2">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                    <input required type="text" placeholder="John Doe" value={demoRequest.name} onChange={(e) => setDemoRequest({...demoRequest, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-sky-500 transition-all font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 ml-2">GTA Business Email</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                    <input required type="email" placeholder="owner@gta-hvac.ca" value={demoRequest.email} onChange={(e) => setDemoRequest({...demoRequest, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-sky-500 transition-all font-bold" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 ml-2">Business Phone (416/905/647)</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                  <input required type="tel" placeholder="+1 (416) 000-0000" value={demoRequest.phone} onChange={(e) => setDemoRequest({...demoRequest, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-sky-500 transition-all font-bold" />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-sky-600 hover:bg-sky-500 text-white py-6 rounded-2xl font-black text-xl shadow-2xl shadow-sky-600/20 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                {isSubmitting ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <>Request GTA Demo <ArrowRightIcon className="w-6 h-6" /></>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Professional SaaS Footer */}
      <footer className="bg-slate-950 text-white pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto divide-y divide-white/10">
          <div className="grid md:grid-cols-4 gap-16 pb-20 text-left">
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center italic">GTA</div>
                <span className="text-xl font-black tracking-tighter uppercase">ServiceVoice.</span>
              </div>
              <p className="text-sm font-bold opacity-40 leading-relaxed uppercase tracking-widest">The leading 2026 white-label AI voice solution for the Greater Toronto Area. Built in Toronto, for Toronto.</p>
            </div>
            
            <div className="space-y-6">
              <h5 className="text-xs font-black uppercase tracking-[0.3em] text-sky-500">Market Coverage</h5>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest opacity-60">
                <li>Toronto Central</li>
                <li>Peel & Halton</li>
                <li>York & Durham</li>
                <li>Hamilton & Niagara</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Regional Support</h5>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest opacity-60">
                <li>HRS Program Guide</li>
                <li>Enbridge Partner Info</li>
                <li>GTA Technical Docs</li>
                <li>Live Toronto Support</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Compliance</h5>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest opacity-60">
                <li>Ontario Privacy Act</li>
                <li>TSSA Standards AI</li>
                <li>NRCAN Certified Data</li>
                <li>GTA Security Center</li>
              </ul>
            </div>
          </div>

          <div className="pt-16 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">© 2026 ServiceVoice Technologies GTA.</p>
            <div className="flex gap-6 opacity-40 italic font-black text-[10px]">
               PROUDLY TORONTO
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">416/905 Market Leaders</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
