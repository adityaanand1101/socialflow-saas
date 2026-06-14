import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Check, 
  Globe, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  Cpu,
  Lock,
  Database,
  MessageSquare,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Constants ---
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// --- Sub-components ---

const SectionBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
    {children}
  </div>
);

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500 py-6 px-8",
      isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded bg-[#111111] flex items-center justify-center">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <span className="text-lg font-black tracking-tighter text-[#111111] uppercase italic font-serif">SocialFlow</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {["Platform", "Features", "Pricing"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 hover:text-black transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/sign-in">
            <Button variant="ghost" className="text-gray-600 hover:text-black text-[11px] font-bold uppercase tracking-widest">
              Login
            </Button>
          </Link>
          <Link to="/sign-up">
            <Button className="bg-[#111111] text-white hover:bg-black px-6 rounded-md text-[11px] font-bold uppercase tracking-widest shadow-none">
              Start Building
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

const AICalibrationDemo = () => {
  const [tone, setTone] = useState("Professional");
  const captions = {
    "Professional": "SocialFlow automates your cross-platform strategy with precision and intelligence.",
    "Sarcastic": "Because manually posting to three different apps is definitely the best use of your 2026.",
    "Viral": "THE SECRET to 10x growth? It's not working harder. It's working autonomously. 🚀 #SaaS",
    "Technical": "Leveraging vector-based semantic analysis to synchronize multi-tenant content delivery pipelines."
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#FBFBFA] border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-gray-200" />
        <div className="w-2 h-2 rounded-full bg-gray-200" />
        <div className="w-2 h-2 rounded-full bg-gray-200" />
        <span className="ml-2 text-[10px] text-gray-400 font-mono">socialflow_studio_v2.exe</span>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Target Tone Profile</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(captions).map(t => (
              <button 
                key={t}
                onClick={() => setTone(t)}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-bold border transition-all",
                  tone === t ? "bg-[#111111] text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Generated Synthesis</label>
          <div className="p-4 bg-white border border-gray-100 rounded-lg min-h-[80px] text-sm text-[#111111] font-medium leading-relaxed">
            <AnimatePresence mode="wait">
              <motion.p
                key={tone}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {captions[tone as keyof typeof captions]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkflowDemo = () => {
  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-sm font-black uppercase tracking-widest">Active Channels</h4>
        <Plus className="w-4 h-4 text-gray-400" />
      </div>
      <div className="space-y-4">
        {[
          { platform: "X / Twitter", time: "10:00 AM", status: "Scheduled", color: "bg-gray-100" },
          { platform: "LinkedIn", time: "11:30 AM", status: "Published", color: "bg-indigo-50", icon: true },
          { platform: "Instagram", time: "02:00 PM", status: "Queued", color: "bg-gray-50" }
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
            <div className={cn("w-8 h-8 rounded flex items-center justify-center", p.color)}>
              <div className="w-4 h-4 rounded-sm border-2 border-gray-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#111111]">{p.platform}</span>
                <span className="text-[9px] font-mono text-gray-400">{p.time}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", p.status === 'Published' ? "bg-emerald-500" : "bg-amber-500")} />
                <span className="text-[10px] text-gray-400 font-medium">{p.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Page ---

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#111111] font-sans selection:bg-indigo-500/10 antialiased overflow-x-hidden">
      <Navbar />

      <main>
        {/* Hero: The Editorial Statement */}
        <section className="pt-52 pb-32 px-8">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <SectionBadge>Protocol v2.0</SectionBadge>
              <h1 className="text-7xl md:text-9xl font-serif tracking-tight leading-[1] text-[#111111] mb-8">
                The Autonomous <br />
                <span className="italic text-gray-400">Social Protocol.</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium">
                SocialFlow is a high-performance workspace for content architects. <br className="hidden md:block" />
                Synchronize, synthesize, and scale with neural-layer automation.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
            >
              <Link to="/sign-up">
                <Button size="lg" className="h-16 px-10 bg-[#111111] text-white hover:bg-black rounded-md font-bold uppercase tracking-widest text-sm shadow-none">
                  Begin Onboarding <ArrowRight className="ml-3 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-16 px-8 border-gray-200 hover:bg-white text-[#111111] font-bold uppercase tracking-widest text-sm rounded-md">
                Review The Stack
              </Button>
            </motion.div>
          </div>
        </section>

        {/* The "How it works" Grid */}
        <section id="platform" className="py-32 px-8 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
             <div className="space-y-12">
                <div className="space-y-6">
                  <h2 className="text-5xl md:text-6xl font-serif tracking-tight leading-none text-[#111111]">
                    Synthesis over <br />Templates.
                  </h2>
                  <p className="text-lg text-gray-500 leading-relaxed font-medium">
                    We don't just schedule posts. We reconstruct your brand's semantic signature to generate content that actually resonates.
                  </p>
                </div>

                <div className="space-y-8">
                  {[
                    { 
                      title: "Neural Tone Mapping", 
                      desc: "Our engine analyzes your last 100 successful posts to replicate your specific humor, vocabulary, and pacing."
                    },
                    { 
                      title: "Universal Queue Protocol", 
                      desc: "One central command for X, LinkedIn, and Instagram. Atomic scheduling with millisecond precision."
                    },
                    { 
                      title: "Absolute Data Sovereignty", 
                      desc: "Your assets live on your terms. Powered by Supabase for databases and Backblaze B2 for encrypted media hosting."
                    }
                  ].map((f, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-3 h-3 text-indigo-600" strokeWidth={4} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#111111]">{f.title}</h4>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="relative group">
                <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] group-hover:bg-indigo-600/10 transition-all duration-1000" />
                <div className="relative">
                   <AICalibrationDemo />
                   <div className="absolute -bottom-12 -right-12 hidden lg:block w-72 h-72">
                      <WorkflowDemo />
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Features: Utilitarian Grid */}
        <section id="features" className="py-40 px-8 bg-[#FBFBFA]">
          <div className="max-w-7xl mx-auto space-y-24">
            <div className="max-w-2xl">
              <SectionBadge>Capabilities</SectionBadge>
              <h2 className="text-5xl font-serif tracking-tight text-[#111111]">Built for the <br />1% of Creators.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-1px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
               {[
                 { icon: Cpu, title: "AI Studio", desc: "Fine-tune LLMs on your specific brand assets. No more generic 'Elevate your growth' captions." },
                 { icon: TrendingUp, title: "Visual Intel", desc: "Real-time engagement heatmaps across every connected endpoint. Data-driven, not opinion-driven." },
                 { icon: Lock, title: "Vault Security", desc: "Enterprise-grade encryption for all social tokens. Your security is our primary directive." },
                 { icon: Database, title: "Edge Storage", desc: "Media is hosted on Backblaze B2's global edge network for instant previewing and reliable publishing." },
                 { icon: Calendar, title: "Visual Queue", desc: "A clean, editorial-style calendar to map out your entire month's strategy in minutes." },
                 { icon: Globe, title: "Web-scale", desc: "Designed to handle high-frequency posting with BullMQ and Redis infrastructure on Render." }
               ].map((f, i) => (
                 <div key={i} className="bg-white p-10 space-y-6 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded bg-[#F7F6F3] border border-gray-200 flex items-center justify-center">
                       <f.icon className="w-5 h-5 text-[#111111]" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#111111]">{f.title}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Pricing: The Minimalist Choice */}
        <section id="pricing" className="py-40 px-8 bg-white border-y border-gray-100">
           <div className="max-w-5xl mx-auto">
              <div className="text-center space-y-6 mb-24">
                 <h2 className="text-6xl font-serif tracking-tight text-[#111111]">Pure Access.</h2>
                 <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Commercial tiers for evolving brands</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {[
                   { name: "Starter", price: "0", features: ["3 Social Channels", "Visual Scheduler", "Standard AI"] },
                   { name: "Professional", price: "29", features: ["15 Social Channels", "AI Tone Calibration", "Custom Analytics", "Priority Support"], popular: true },
                   { name: "Elite", price: "99", features: ["Infinite Channels", "API Access", "Custom LLM Fine-tuning", "White Label"] }
                 ].map((p, i) => (
                   <div key={i} className={cn(
                     "p-10 rounded-xl border flex flex-col justify-between transition-all",
                     p.popular ? "bg-[#111111] text-white border-black" : "bg-white text-[#111111] border-gray-200"
                   )}>
                      <div className="space-y-8">
                        <div>
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">{p.name}</h3>
                           <div className="flex items-baseline gap-1">
                              <span className="text-5xl font-serif">${p.price}</span>
                              <span className={cn("text-xs font-bold", p.popular ? "text-gray-400" : "text-gray-400")}>/mo</span>
                           </div>
                        </div>
                        <ul className="space-y-4">
                           {p.features.map(f => (
                             <li key={f} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
                                <Check className={cn("w-3 h-3", p.popular ? "text-indigo-400" : "text-indigo-600")} strokeWidth={4} /> {f}
                             </li>
                           ))}
                        </ul>
                      </div>
                      <Link to="/sign-up" className="mt-12">
                         <Button className={cn(
                           "w-full h-12 rounded-md font-bold uppercase tracking-widest text-[10px] shadow-none",
                           p.popular ? "bg-white text-black hover:bg-gray-100" : "bg-[#111111] text-white hover:bg-black"
                         )}>
                           Initialize {p.name}
                         </Button>
                      </Link>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA: Final Statement */}
        <section className="py-56 px-8 relative overflow-hidden bg-[#FBFBFA]">
           <div className="max-w-4xl mx-auto text-center space-y-12">
              <h2 className="text-7xl md:text-8xl font-serif tracking-tighter text-[#111111] leading-none">
                Build your legacy <br />
                <span className="italic text-gray-400">on autopilot.</span>
              </h2>
              <div className="flex flex-col items-center gap-8">
                <Link to="/sign-up">
                  <Button size="lg" className="h-20 px-16 text-xl bg-[#111111] text-white hover:bg-black rounded-md font-bold uppercase tracking-widest shadow-none transition-transform active:scale-95">
                    Start Your Trial
                  </Button>
                </Link>
                <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px]">Instant access • No credit card required</p>
              </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-24 px-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
          <div className="col-span-2 space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#111111] flex items-center justify-center">
                <Sparkles className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-black tracking-tighter text-[#111111] italic font-serif">SocialFlow</span>
            </div>
            <p className="text-gray-500 max-w-sm text-sm font-medium leading-relaxed">
              Synchronized intelligence for modern brand architects. <br />
              Synthesizing content, optimizing reach, ensuring sovereignty.
            </p>
          </div>

          {[
            { title: "Protocol", links: ["Features", "Security", "AI Studio", "Infrastructure"] },
            { title: "Company", links: ["Privacy", "Terms", "Documentation", "Contact"] }
          ].map(g => (
            <div key={g.title} className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]">{g.title}</h4>
              <div className="flex flex-col gap-4">
                {g.links.map(l => (
                  <a key={l} href="#" className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© {new Date().getFullYear()} SOCIALFLOW TECH. ALL RIGHTS RESERVED.</span>
           <div className="flex items-center gap-8">
              <MessageSquare className="w-4 h-4 text-gray-300 hover:text-black transition-colors cursor-pointer" />
              <div className="w-4 h-4 rounded-sm border-2 border-gray-200 hover:border-black transition-colors cursor-pointer" />
           </div>
        </div>
      </footer>
    </div>
  );
};
