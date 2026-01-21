
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
  SparklesIcon
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
            {isActive ? (mode === 'chloe' ? 'Rebate Strategy' : 'Dispatch Logic') : 'ServiceVoice AI'}
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

  const audioContextRef = useRef<AudioContext | null>(null);
  const outContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

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
          description: 'Submit customer lead data directly to the White-Label CRM.',
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING },
            summary: { type: Type.STRING },
            temp: { type: Type.STRING, description: 'HOT or WARM' },
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
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "lead successfully pushed to CRM" } }
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
          systemInstruction: `You are ServiceVoice AI, a white-label voice solution. 
          Today you are demonstrating your capabilities to an HVAC contractor.
          PERSONAS:
          - Chloe: Expert in 2026 Home Renovation Savings (HRS). Friendly. $7500 electric / $2000 gas rebates.
          - Sam: Urgent emergency dispatcher. 4-hour guarantee.
          SWITCHING: If they mention emergency (leak, no heat), switch to Sam.
          MANDATORY: If gas smell, say: "Leave the house, hang up, call 911 immediately."`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { alert("Mic required for demo."); }
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
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">ServiceVoice<span className="text-sky-600">.</span></h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold uppercase tracking-widest hover:text-sky-600 transition-colors">Platform</a>
            <a href="#pricing" className="text-sm font-bold uppercase tracking-widest hover:text-sky-600 transition-colors">Pricing</a>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
              {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-500" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
            </button>
            <button className="bg-sky-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-sky-600/20 hover:scale-105 active:scale-95 transition-all">
              Book Tech Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 px-4 py-2 rounded-full border border-sky-500/20">
            <SparklesIcon className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">2026 HVAC SaaS Breakthrough</span>
          </div>

          <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-5xl mx-auto">
            Your Brand.<br/>
            Our <span className="text-sky-600">Voice.</span><br/>
            Total <span className="text-orange-500">Revenue.</span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
            ServiceVoice provides HVAC contractors with high-fidelity AI agents that integrate directly with Jobber and ServiceTitan. Pre-qualify $10k rebates and dispatch 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={startVoiceDemo} 
              className={`px-12 py-8 rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}
            >
              {isVoiceActive ? 'Stop Demo Agent' : 'Live Demo: Talk To AI'}
              <MicrophoneIcon className="w-6 h-6" />
            </button>
            <button className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-white/10 px-12 py-8 rounded-[2.5rem] font-black text-2xl hover:bg-slate-50 transition-all">
              Get SaaS Quote
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Demo Hub */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="glass-card rounded-[3rem] p-12 border-sky-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <CpuChipIcon className="w-40 h-40" />
            </div>
            
            <div className="space-y-8 relative z-10">
              <h3 className="text-4xl font-black tracking-tighter">AI Persona Engine</h3>
              <p className="text-lg text-slate-500 font-medium">Switch between Chloe (Sales) and Sam (Emergency) to see how the white-label agent handles different customer intents.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setActivePersona('chloe')} 
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${activePersona === 'chloe' ? 'border-sky-500 bg-sky-500/10' : 'border-slate-200 dark:border-white/10'}`}
                >
                  <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-sky-600" />
                  <span className="font-black text-xs uppercase tracking-widest">Chloe (Sales)</span>
                </button>
                <button 
                  onClick={() => setActivePersona('sam')} 
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${activePersona === 'sam' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-200 dark:border-white/10'}`}
                >
                  <WrenchScrewdriverIcon className="w-8 h-8 text-orange-600" />
                  <span className="font-black text-xs uppercase tracking-widest">Sam (Dispatch)</span>
                </button>
              </div>

              {lastLead && (
                <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-3xl animate-in zoom-in duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-green-600">Lead Pushed to CRM</span>
                    <CheckBadgeIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <pre className="text-[10px] font-mono opacity-60 overflow-x-auto">
                    {JSON.stringify(lastLead, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <ProductOrb isActive={isVoiceActive} mode={activePersona} />
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-20 px-6 bg-slate-100 dark:bg-white/5">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter">Contractor First Platform</h3>
          </div>

          <div className="grid md:grid-cols-12 gap-6 h-auto md:h-[600px]">
            <div className="md:col-span-8 glass-card rounded-[3rem] p-10 flex flex-col justify-between border-sky-500/10 hover:border-sky-500/30 transition-all">
              <RectangleGroupIcon className="w-12 h-12 text-sky-600 mb-8" />
              <div>
                <h4 className="text-3xl font-black mb-4 tracking-tight">Full CRM Integration</h4>
                <p className="text-lg text-slate-500 font-medium">Connect ServiceVoice to Jobber, ServiceTitan, or Housecall Pro in seconds. AI-captured leads appear instantly as 'Ready-to-Schedule' jobs in your dashboard.</p>
              </div>
            </div>
            <div className="md:col-span-4 bg-sky-600 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl shadow-sky-600/30">
              <DevicePhoneMobileIcon className="w-12 h-12 mb-8" />
              <div>
                <h4 className="text-3xl font-black mb-4 tracking-tight">Mobile First</h4>
                <p className="opacity-80 font-bold">Manage your AI settings from the job site. Update pricing or dispatch rules in real-time.</p>
              </div>
            </div>
            <div className="md:col-span-4 glass-card rounded-[3rem] p-10 flex flex-col border-orange-500/10 hover:border-orange-500/30 transition-all">
              <BoltIcon className="w-12 h-12 text-orange-600 mb-8" />
              <h4 className="text-2xl font-black mb-4 tracking-tight">Instant ROI</h4>
              <p className="text-sm text-slate-500 font-bold">The platform pays for itself with the first saved emergency furnace install. Typical ROI is 10x in the first 30 days.</p>
            </div>
            <div className="md:col-span-8 glass-card rounded-[3rem] p-10 flex flex-col md:flex-row gap-8 items-center border-slate-200 dark:border-white/10">
              <div className="flex-1">
                <h4 className="text-3xl font-black mb-4 tracking-tight">Multi-Region Logic</h4>
                <p className="text-lg text-slate-500 font-medium">Automatically route calls based on area code. Perfect for contractors covering massive regions like the GTA or Tri-State area.</p>
              </div>
              <div className="w-full md:w-64 h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                 <GlobeAltIcon className="w-16 h-16 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Hub */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter">SaaS Plans</h3>
            <p className="text-xl text-slate-500 font-bold">Simple, transparent pricing for any fleet size.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {CONFIG.pricing.map((tier, i) => (
              <div key={i} className={`p-10 rounded-[3.5rem] border-2 flex flex-col transition-all duration-500 hover:scale-[1.02] ${tier.popular ? 'bg-sky-600 border-sky-500 text-white shadow-2xl shadow-sky-600/40' : 'glass-card border-slate-200 dark:border-white/10'}`}>
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
                <button className={`w-full py-6 rounded-3xl font-black text-xl transition-all ${tier.popular ? 'bg-white text-sky-600' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                  Deploy AI
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional SaaS Footer */}
      <footer className="bg-slate-950 text-white pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto divide-y divide-white/10">
          <div className="grid md:grid-cols-4 gap-16 pb-20">
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                  <BoltIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-black tracking-tighter uppercase">ServiceVoice.</span>
              </div>
              <p className="text-sm font-bold opacity-40 leading-relaxed uppercase tracking-widest">
                The leading 2026 white-label AI voice solution for HVAC contractors worldwide. 
              </p>
            </div>
            
            <div className="space-y-6">
              <h5 className="text-xs font-black uppercase tracking-[0.3em] text-sky-500">Product</h5>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest opacity-60">
                <li><a href="#" className="hover:text-white transition-colors">AI Agents</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Voice Lab</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Support</h5>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest opacity-60">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partner Program</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Legal</h5>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest opacity-60">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-16 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">© 2026 ServiceVoice Technologies Inc.</p>
            <div className="flex gap-6 opacity-40">
               <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:opacity-100 transition-opacity cursor-pointer">
                 <GlobeAltIcon className="w-4 h-4" />
               </div>
               <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:opacity-100 transition-opacity cursor-pointer">
                 <ShieldCheckIcon className="w-4 h-4" />
               </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">HVAC Automation Excellence</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
