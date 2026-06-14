import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  Cpu, 
  Database, 
  ArrowRight, 
  Zap, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  ArrowUpRight, 
  Lock, 
  Layers, 
  Terminal, 
  Activity,
  Plus,
  Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Constants ---
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// --- Components ---

const SpotlightCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn("relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] transition-all duration-500", className)}
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-300"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.06), transparent 40%)`,
          opacity,
        }}
      />
      {children}
    </div>
  );
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 w-full z-[100] transition-all duration-500 px-6 py-6",
        scrolled ? "py-4" : "py-6"
      )}
    >
      <div className={cn(
        "max-w-6xl mx-auto flex items-center justify-between px-6 py-2.5 rounded-2xl border transition-all duration-500",
        scrolled 
          ? "bg-navy-950/80 backdrop-blur-xl border-white/10 shadow-2xl" 
          : "bg-transparent border-transparent"
      )}>
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-all duration-300">
            <Sparkles className="text-white w-4.5 h-4.5" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white uppercase italic">SocialFlow</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          <a href="#protocol" className="hover:text-white transition-colors">Protocol</a>
          <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
          <a href="#pricing" className="hover:text-white transition-colors">Access</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/sign-in">
            <Button variant="ghost" className="text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-widest px-4">Login</Button>
          </Link>
          <Link to="/sign-up">
            <Button className="bg-white text-black hover:bg-slate-200 px-6 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95">
              Initialize
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-8 flex items-center justify-between text-left group"
      >
        <span className="text-xl font-bold text-slate-300 group-hover:text-white transition-colors tracking-tight">{question}</span>
        <div className={cn("w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500", isOpen && "bg-indigo-600 border-indigo-600 rotate-45")}>
          <Plus className="w-4 h-4 text-white" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <p className="pb-8 text-slate-500 leading-relaxed max-w-3xl text-lg font-medium">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PostSynthesisDemo = () => {
  const [activeTab, setActiveTab] = useState("X");
  const posts = {
    "X": { content: "The future of brand scaling isn't more people. It's better protocols. 🧵 #SaaS", visual: "Thread Structure" },
    "Instagram": { content: "DOMINANCE. 🚀\n\nScale your presence autonomously with SocialFlow's neural engine.", visual: "Square Ratio + Grid" },
    "LinkedIn": { content: "Insight: Autonomous protocols are the new competitive advantage for 2026 growth leads.", visual: "Carousel PDF Optimization" }
  };

  return (
    <div className="w-full h-full bg-navy-950/50 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex gap-4">
          {Object.keys(posts).map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn("text-[10px] font-black uppercase tracking-widest transition-all", activeTab === t ? "text-indigo-400 underline decoration-2 underline-offset-8" : "text-slate-600 hover:text-slate-300")}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary" />
            <div className="space-y-1">
              <div className="h-3 w-24 bg-white/10 rounded-full" />
              <div className="h-2 w-16 bg-white/5 rounded-full" />
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
             <AnimatePresence mode="wait">
                <motion.p
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-gray-300 font-medium leading-relaxed italic"
                >
                  "{posts[activeTab as keyof typeof posts].content}"
                </motion.p>
             </AnimatePresence>
          </div>
        </div>
        <div className="pt-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-slate-600" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Synthesis Mode: {posts[activeTab as keyof typeof posts].visual}</span>
           </div>
           <Button size="sm" className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-600/30 text-[10px] font-black uppercase rounded-lg">Sync Deploy</Button>
        </div>
      </div>
    </div>
  );
};

export const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden antialiased">
      {/* Visual Infrastructure */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[160px] opacity-50" />
        <div className="absolute bottom-[10%] right-[-5%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[160px] opacity-40" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 opacity-[0.1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <Navbar />

      <main>
        {/* --- SECTION 1: THE MANIFESTO (Hero) --- */}
        <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 pt-20">
          <motion.div 
            style={{ scale: heroScale, opacity: heroOpacity }}
            className="text-center space-y-12 max-w-6xl relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">System Protocol v2.4 Active</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
              className="text-[clamp(3.5rem,12vw,9rem)] font-black leading-[0.8] tracking-tighter text-white uppercase italic"
            >
              REPLICATE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-600">DOMINANCE.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight"
            >
              The first autonomous content engine built for the high-end. <br className="hidden md:block" /> 
              Synthesis over templates. Intelligence over effort.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: EASE }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8"
            >
              <Link to="/sign-up">
                <Button className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-200 transition-all shadow-2xl active:scale-95 group">
                  Initialize Protocol
                  <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button variant="ghost" className="text-slate-500 hover:text-white font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-3">
                <Terminal className="w-4 h-4" /> Review Technical Specs
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1, duration: 2 }}
            className="absolute bottom-12 flex flex-col items-center gap-4"
          >
             <div className="h-16 w-px bg-gradient-to-b from-indigo-500/0 via-indigo-500 to-indigo-500/0" />
             <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-600">Scroll to Decrypt</span>
          </motion.div>
        </section>

        {/* --- SECTION 2: THE INFRASTRUCTURE (Social Proof) --- */}
        <section className="py-20 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-8">
            <p className="text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.5em] mb-16 italic">Built on a Sovereign Tech Stack</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center opacity-40 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
               <div className="flex flex-col items-center gap-3">
                  <Globe className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs font-black tracking-widest uppercase">Supabase Core</span>
               </div>
               <div className="flex flex-col items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-black tracking-widest uppercase">Backblaze Vault</span>
               </div>
               <div className="flex flex-col items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <span className="text-xs font-black tracking-widest uppercase">OpenAI Neural</span>
               </div>
               <div className="flex flex-col items-center gap-3">
                  <Lock className="w-6 h-6 text-blue-400" />
                  <span className="text-xs font-black tracking-widest uppercase">Clerk Security</span>
               </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: THE PROTOCOL (Interactive Features) --- */}
        <section id="protocol" className="py-48 px-6">
           <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-12 pr-12">
                 <div className="space-y-6">
                    <div className="w-12 h-1 rounded-full bg-indigo-600" />
                    <h2 className="text-6xl font-black tracking-tighter text-white italic leading-[0.9] uppercase">NEURAL <br />CALIBRATION.</h2>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed tracking-tight">
                       Most tools give you templates. We give you a digital twin. Our engine learns your semantic signature to synthesize content that actually sounds like you.
                    </p>
                 </div>
                 
                 <div className="space-y-10">
                    {[
                      { icon: Zap, title: "Recursive Learning", desc: "Engine improves with every post. It understands your humor, your pacing, and your hooks." },
                      { icon: Activity, title: "High-Frequency Flow", desc: "Atomic scheduling protocol. Synchronize 10+ channels with millisecond precision." },
                      { icon: Database, title: "Media Sovereignty", desc: "Isolated B2 storage for every workspace. Your assets, encrypted and always available." }
                    ].map((f, i) => (
                      <motion.div 
                        whileInView={{ opacity: 1, x: 0 }}
                        initial={{ opacity: 0, x: -20 }}
                        key={i} 
                        className="flex gap-6"
                      >
                         <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <f.icon className="w-5 h-5 text-indigo-400" />
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-[0.1em] text-white italic">{f.title}</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>

              <div className="lg:col-span-7 relative group">
                 <div className="absolute inset-0 bg-indigo-600/10 blur-[120px] group-hover:bg-indigo-600/20 transition-all duration-1000" />
                 <motion.div 
                   whileHover={{ y: -10, rotateX: 2, rotateY: -2 }}
                   transition={{ type: "spring", stiffness: 100 }}
                 >
                    <PostSynthesisDemo />
                 </motion.div>
                 {/* Decorative haptic elements */}
                 <div className="absolute -bottom-8 -left-8 p-6 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl hidden md:block">
                    <div className="flex items-center gap-4">
                       <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Uplinking to Tokyo Cluster</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- SECTION 4: THE ARCHITECTURE (Bento Grid) --- */}
        <section id="intelligence" className="py-48 px-6 bg-white/[0.01]">
           <div className="max-w-7xl mx-auto space-y-24">
              <div className="max-w-3xl space-y-6">
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic leading-none uppercase">ENGINEERED <br />FOR SUPREMACY.</h2>
                 <p className="text-xl text-slate-500 font-medium">The most advanced social intelligence suite ever assembled. One workspace, infinite reach.</p>
              </div>

              <div className="grid md:grid-cols-12 grid-rows-2 gap-6">
                 <SpotlightCard className="md:col-span-8 p-12 flex flex-col justify-between group">
                    <div className="space-y-6">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
                          <Cpu className="w-6 h-6 text-indigo-400" />
                       </div>
                       <h3 className="text-4xl font-black tracking-tighter text-white uppercase italic">AI Studio 2.0</h3>
                       <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
                          Proprietary semantic mapping engine. Fine-tune your AI models on your own historical data. Replicate viral hooks and thread architectures in seconds.
                       </p>
                    </div>
                    <div className="mt-12 h-px w-full bg-white/5 relative">
                       <motion.div 
                         animate={{ left: ["0%", "100%", "0%"] }}
                         transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                         className="absolute -top-1 w-20 h-2 bg-indigo-500 blur-sm rounded-full" 
                       />
                    </div>
                 </SpotlightCard>

                 <SpotlightCard className="md:col-span-4 p-10 space-y-6">
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                    <h3 className="text-xl font-black tracking-tighter text-white uppercase">NEURAL INTEL</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Predictive analytics that identify viral opportunity windows before they happen.</p>
                 </SpotlightCard>

                 <SpotlightCard className="md:col-span-4 p-10 space-y-6 bg-gradient-to-br from-indigo-900/10 to-transparent">
                    <Layers className="w-8 h-8 text-purple-400" />
                    <h3 className="text-xl font-black tracking-tighter text-white uppercase">OMNI-DELIVERY</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Synchronized multi-channel publishing with platform-specific meta-optimizations.</p>
                 </SpotlightCard>

                 <SpotlightCard className="md:col-span-8 p-10 flex items-center gap-12 overflow-hidden">
                    <div className="space-y-6 flex-1">
                       <h3 className="text-3xl font-black tracking-tighter text-white uppercase italic">Vault-Grade Security</h3>
                       <p className="text-slate-400 text-sm font-medium leading-relaxed">Military-grade AES-256 encryption for all social credentials. Your tokens never touch the public internet in plain text.</p>
                    </div>
                    <div className="w-48 h-48 bg-white/5 border border-white/10 rounded-full flex items-center justify-center relative shrink-0">
                       <Lock className="w-12 h-12 text-slate-700" />
                       <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
                    </div>
                 </SpotlightCard>
              </div>
           </div>
        </section>

        {/* --- SECTION 5: THE CONSENSUS (Reviews) --- */}
        <section id="reviews" className="py-48 px-6 relative">
           <div className="max-w-7xl mx-auto space-y-24">
              <div className="flex flex-col md:flex-row items-end justify-between gap-8">
                 <h2 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase text-white leading-none">THE ELITE <br />CONSENSUS.</h2>
                 <div className="flex gap-4">
                    <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 h-14 w-14 p-0 group"><ChevronLeft className="w-5 h-5 group-active:-translate-x-1" /></Button>
                    <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 h-14 w-14 p-0 group"><ChevronRight className="w-5 h-5 group-active:translate-x-1" /></Button>
                 </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {[
                   { name: "Julian Gray", role: "Indie Architect", content: "I don't use 'tools'. I use protocols. SocialFlow is the only engine that understands the difference between posting and dominating." },
                   { name: "Sophia V.", role: "Creative Director", content: "The AI Studio is scary good. It mapped my voice in 15 minutes. Our engagement is up 300% since synthesis." },
                   { name: "Marcus T.", role: "Growth Engineer", content: "Decoupled architecture. B2 media hosting. Supabase backend. Finally, a social tool built by engineers for architects." }
                 ].map((rev, i) => (
                   <motion.div 
                     whileHover={{ y: -5 }}
                     key={i} 
                     className="p-10 rounded-[3rem] border border-white/5 bg-white/[0.01] space-y-8"
                   >
                      <Quote className="w-8 h-8 text-indigo-500/30" />
                      <p className="text-lg text-slate-300 font-medium leading-relaxed italic">"{rev.content}"</p>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-gradient-primary" />
                         <div>
                            <p className="text-sm font-bold text-white uppercase tracking-tighter">{rev.name}</p>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{rev.role}</p>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* --- SECTION 6: THE ACCESS (Pricing) --- */}
        <section id="pricing" className="py-48 px-6 bg-[#030303] relative">
           <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
           <div className="max-w-4xl mx-auto text-center space-y-32">
              <div className="space-y-6">
                 <h2 className="text-6xl md:text-9xl font-black tracking-tighter italic uppercase text-white leading-none">PROTOCOL <br />ACCESS.</h2>
                 <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[11px]">Commercial integration tiers</p>
              </div>

              <div className="grid md:grid-cols-3 gap-10">
                 {[
                   { name: "Foundations", price: "0", features: ["3 Channels", "Standard AI", "Visual Queue"] },
                   { name: "Growth", price: "29", features: ["15 Channels", "Tone Calibration", "Neural Analytics", "Priority Flow"], popular: true },
                   { name: "Elite", price: "99", features: ["Infinite Channels", "API Protocol", "White Labeling", "Dedicated Cluster"] }
                 ].map((p, i) => (
                   <div key={i} className={cn(
                     "p-10 rounded-[3rem] border flex flex-col justify-between transition-all duration-700 relative group",
                     p.popular ? "bg-[#0F1117] border-indigo-500 shadow-[0_0_80px_rgba(79,70,229,0.15)] scale-105 z-10" : "bg-white/[0.01] border-white/5"
                   )}>
                      <div className="space-y-12">
                        <div className="text-center space-y-2">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic">{p.name}</h3>
                           <div className="flex items-baseline justify-center gap-1">
                              <span className="text-6xl font-black tracking-tighter text-white italic">${p.price}</span>
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">/mo</span>
                           </div>
                        </div>
                        <ul className="space-y-5 text-left">
                           {p.features.map(f => (
                             <li key={f} className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-indigo-500" strokeWidth={3} /> {f}
                             </li>
                           ))}
                        </ul>
                      </div>
                      <Link to="/sign-up" className="mt-16">
                         <Button className={cn(
                           "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all",
                           p.popular ? "bg-white text-black hover:bg-slate-200" : "bg-white/5 text-white hover:bg-white/10"
                         )}>
                           Initialize {p.name}
                         </Button>
                      </Link>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* --- SECTION 7: THE KNOWLEDGE (FAQ) --- */}
        <section id="faq" className="py-48 px-6 border-t border-white/5">
           <div className="max-w-4xl mx-auto space-y-24">
              <div className="space-y-4">
                 <h2 className="text-5xl font-black tracking-tighter italic uppercase text-white leading-none">INTELLIGENCE <br />BRIEFING.</h2>
                 <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Answers to critical queries</p>
              </div>
              <div className="space-y-2">
                 <FAQItem 
                   question="How does tone calibration actually work?" 
                   answer="We use recursive semantic analysis to identify patterns in your historical high-performance content. The system doesn't just mimic words; it reconstructs the syntactical structure and emotional resonance of your brand's unique signature."
                 />
                 <FAQItem 
                   question="Is my data truly sovereign?" 
                   answer="Yes. We leverage isolated B2 storage buckets and private Supabase schemas. Your social media tokens are never shared with 3rd parties and are encrypted at rest with military-grade protocols."
                 />
                 <FAQItem 
                   question="What platforms are currently operational?" 
                   answer="SocialFlow currently supports X (Twitter), LinkedIn, and Instagram. Threads and Bluesky integration is currently in the late stage of alpha testing for Elite members."
                 />
                 <FAQItem 
                   question="Can I automate my entire monthly calendar at once?" 
                   answer="Our Universal Queue Protocol allows you to orchestrate an entire month's content in a single session. The system handles all cross-platform synchronization and publishing autonomously."
                 />
              </div>
           </div>
        </section>

        {/* --- SECTION 8: THE INITIALIZATION (Final CTA) --- */}
        <section className="py-64 px-6 relative overflow-hidden bg-gradient-to-t from-indigo-950/20 to-transparent">
           <div className="max-w-5xl mx-auto rounded-[5rem] bg-navy-900 border border-white/10 p-24 text-center space-y-12 relative shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-all duration-1000" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-600/10 blur-[160px] -z-10 rounded-full" />
              
              <h2 className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-none italic uppercase">READY FOR <br />INFINITE REACH?</h2>
              
              <div className="flex flex-col items-center gap-10">
                 <Link to="/sign-up">
                   <Button className="h-20 px-16 text-2xl bg-white text-black hover:bg-slate-200 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-[0_0_100px_rgba(255,255,255,0.1)] transition-transform active:scale-95 group">
                     START PROTOCOL
                     <ArrowUpRight className="ml-4 w-6 h-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                   </Button>
                 </Link>
                 <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
                    <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> NO CREDIT CARD</div>
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> INSTANT UPLINK</div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      {/* --- SECTION 9: THE FOOTER --- */}
      <footer className="py-32 px-12 border-t border-white/5 bg-[#010101]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-20">
          <div className="col-span-2 space-y-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-3xl font-black tracking-tighter text-white italic">SocialFlow.</span>
            </div>
            <p className="text-slate-500 max-w-sm text-[11px] font-black uppercase tracking-[0.3em] leading-loose">
              Synthesizing brand intelligence for the next generation of social media dominance. Secure. Autonomous. Sovereign.
            </p>
            <div className="flex gap-8 opacity-20 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
               <Globe className="w-6 h-6 cursor-pointer" />
               <Zap className="w-6 h-6 cursor-pointer" />
               <Sparkles className="w-6 h-6 cursor-pointer" />
            </div>
          </div>

          {[
            { title: "Protocol", links: ["Intelligence", "Architecture", "Neural Studio", "Security"] },
            { title: "Sovereignty", links: ["Privacy", "Terms", "Documentation", "Contact"] },
            { title: "Social", links: ["X / Twitter", "LinkedIn", "Instagram", "Threads"] }
          ].map(g => (
            <div key={g.title} className="space-y-8">
              <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic underline decoration-indigo-600 decoration-4 underline-offset-8">{g.title}</h4>
              <div className="flex flex-col gap-5">
                {g.links.map(l => (
                  <a key={l} href="#" className="text-[12px] font-bold uppercase tracking-widest text-slate-600 hover:text-indigo-400 transition-all">{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
           <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em]">© {new Date().getFullYear()} SOCIALFLOW TECH PROTOCOL. ALL RIGHTS RESERVED.</span>
           <div className="flex items-center gap-10 text-[10px] font-black text-slate-800 uppercase tracking-[0.5em]">
              <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-emerald-500" /> STATUS: OPERATIONAL</span>
              <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> NODE: TOKYO_01</span>
           </div>
        </div>
      </footer>
    </div>
  );
};
