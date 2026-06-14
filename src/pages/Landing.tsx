import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { 
  Sparkles, 
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Layers,
  Cpu,
  MessageCircle,
  Briefcase,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Constants ---
const EASE = [0.32, 0.72, 0, 1] as [number, number, number, number];

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="fixed top-0 w-full z-[システム] pt-6 px-6"
    >
      <div className={cn(
        "max-w-5xl mx-auto flex items-center justify-between px-6 py-2 rounded-full border transition-all duration-700",
        isScrolled 
          ? "bg-[#050505]/80 backdrop-blur-2xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
          : "bg-transparent border-transparent"
      )}>
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            <Sparkles className="text-white w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-black tracking-tighter text-white uppercase italic">SocialFlow</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {["Features", "Pricing", "Enterprise"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/sign-in">
            <Button variant="ghost" className="text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-widest px-4">
              Login
            </Button>
          </Link>
          <Link to="/sign-up">
            <Button className="bg-white text-black hover:bg-slate-200 h-9 px-6 rounded-full text-[11px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-xl">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

const MagneticButton = ({ children, className, variant = "default", size = "default" }: any) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current?.getBoundingClientRect() || { height: 0, width: 0, left: 0, top: 0 };
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      <Button variant={variant} size={size} className={cn("rounded-full font-black uppercase tracking-widest group", className)}>
        {children}
        <div className="ml-3 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Button>
    </motion.div>
  );
};

const BentoCard = ({ children, className, delay = 0 }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={cn("doppelrand-shell p-1.5", className)}
    >
      <div className="doppelrand-core h-full w-full p-8 relative overflow-hidden group">
        {children}
      </div>
    </motion.div>
  );
};

export const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const rotate = useTransform(scrollYProgress, [0, 0.2], [0, 2]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden antialiased">
      {/* Texture Layers */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="fixed inset-0 pointer-events-none -z-10 mesh-gradient opacity-40" />

      <Navbar />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[100dvh] flex flex-col items-center justify-center px-6 relative pt-20">
          <motion.div 
            style={{ scale, rotateX: rotate }}
            className="text-center space-y-12 max-w-5xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: EASE }}
              className="inline-flex items-center gap-3 px-4 py-1 rounded-full bg-white/5 border border-white/10"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,1)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">v2.0 is now live</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: EASE }}
              className="text-[clamp(3rem,10vw,7rem)] font-black leading-[0.85] tracking-tighter text-white"
            >
              AUTONOMOUS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-500 italic">SOCIAL ENGINE.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed"
            >
              The unified protocol for brand intelligence. Orchestrate cross-platform dominance with neural content generation and visual campaign planning.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: EASE }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link to="/sign-up">
                <Button className="h-14 px-10 rounded-full bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] group">
                  Initialize Success
                  <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button variant="ghost" className="text-slate-400 hover:text-white font-black uppercase tracking-[0.2em] text-xs">
                Review Protocol
              </Button>
            </motion.div>
          </motion.div>

          {/* Social Proof Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="absolute bottom-12 w-full max-w-7xl px-6 flex flex-wrap justify-center items-center gap-16 opacity-20 hover:opacity-100 transition-opacity duration-700"
          >
             <div className="flex items-center gap-2 font-black text-sm tracking-widest uppercase italic italic">SUPABASE</div>
             <div className="flex items-center gap-2 font-black text-sm tracking-widest uppercase italic">BACKBLAZE</div>
             <div className="flex items-center gap-2 font-black text-sm tracking-widest uppercase italic">OPENAI</div>
             <div className="flex items-center gap-2 font-black text-sm tracking-widest uppercase italic">CLERK</div>
          </motion.div>
        </section>

        {/* Feature Intelligence Section */}
        <section id="features" className="py-48 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-8 pr-12">
               <div className="w-12 h-1 rounded-full bg-indigo-600" />
               <h2 className="text-5xl font-black tracking-tighter text-white leading-none">NEURAL <br/>LAYER.</h2>
               <p className="text-slate-500 font-medium leading-relaxed">Our infrastructure is built for high-frequency content production and precision scheduling.</p>
               <Button variant="outline" className="rounded-full border-white/10 text-[10px] font-black uppercase tracking-widest px-6 h-10">Read documentation</Button>
            </div>

            <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
               <BentoCard className="md:col-span-2">
                  <div className="flex flex-col md:flex-row items-center gap-12">
                     <div className="space-y-6 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                           <Cpu className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter text-white uppercase">AI Studio 2.0</h3>
                        <p className="text-slate-400 text-sm font-medium">Fine-tuned models that understand your brand's unique semantic signature. Generate threads, captions, and visual prompts in milliseconds.</p>
                     </div>

                     <div className="w-full md:w-64 h-48 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent animate-pulse" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full" />
                     </div>
                  </div>
               </BentoCard>

               <BentoCard delay={0.1}>
                  <TrendingUp className="w-8 h-8 text-blue-400 mb-6" />
                  <h3 className="text-xl font-black text-white uppercase mb-4 tracking-tight">Real-time Intel</h3>
                  <p className="text-slate-500 text-xs font-bold leading-relaxed">Global engagement monitoring across connected endpoints.</p>
               </BentoCard>

               <BentoCard delay={0.2}>
                  <Layers className="w-8 h-8 text-pink-400 mb-6" />
                  <h3 className="text-xl font-black text-white uppercase mb-4 tracking-tight">Omni-Channel</h3>
                  <p className="text-slate-500 text-xs font-bold leading-relaxed">Synchronized delivery to X, LinkedIn, and Instagram.</p>
               </BentoCard>
            </div>
          </div>
        </section>

        {/* Pricing Protocol */}
        <section id="pricing" className="py-48 px-6 bg-[#030303]">
          <div className="max-w-4xl mx-auto text-center space-y-24">
            <div className="space-y-6">
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic">SUBSCRIPTION <br/>PROTOCOL.</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Transparent pricing for every stage of growth</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Starter", price: "0", features: ["3 Channels", "Standard AI", "Visual Queue"] },
                { name: "Pro", price: "29", features: ["15 Channels", "Custom AI Models", "Full Analytics"], popular: true },
                { name: "Elite", price: "99", features: ["Infinite Channels", "API Access", "White Label"] }
              ].map((p, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className={cn(
                    "doppelrand-shell p-1 relative",
                    p.popular ? "ring-2 ring-indigo-600/50 shadow-[0_0_60px_rgba(79,70,229,0.2)]" : ""
                  )}
                >
                  <div className="doppelrand-core p-10 h-full flex flex-col justify-between space-y-12">
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{p.name}</span>
                        {p.popular && <div className="px-2 py-0.5 rounded bg-indigo-600 text-[8px] font-black uppercase text-white">Recommended</div>}
                      </div>
                      <div className="text-5xl font-black tracking-tighter text-white italic">${p.price}</div>
                      <ul className="space-y-4 text-left">
                        {p.features.map(f => (
                          <li key={f} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" strokeWidth={3} /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link to="/sign-up">
                      <Button className={cn(
                        "w-full rounded-full h-12 font-black uppercase tracking-widest text-[10px] transition-all",
                        p.popular ? "bg-white text-black hover:bg-slate-200" : "bg-white/5 text-white hover:bg-white/10"
                      )}>
                        Activate {p.name}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-64 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-600/10 blur-[150px] -z-10 rounded-full scale-150" />
          <div className="max-w-5xl mx-auto text-center space-y-16">
            <h2 className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-none">READY TO <br />DOMINATE?</h2>
            <div className="flex flex-col items-center gap-8">
              <MagneticButton className="h-20 px-16 text-2xl bg-indigo-600 text-white shadow-2xl">
                Get Started
              </MagneticButton>
              <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px]">Infinite Reach starts here</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Protocol */}
      <footer className="py-20 px-8 border-t border-white/5 bg-[#010101]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-16">
          <div className="space-y-8 max-w-md text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white italic">SocialFlow.</span>
            </div>
            <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.2em] leading-loose">
              Synthesizing brand intelligence for the next generation of digital dominance.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-20">
             {[
               { title: "Network", links: ["X", "LinkedIn", "Instagram"] },
               { title: "Protocol", links: ["Privacy", "Terms", "Documentation"] }
             ].map(group => (
               <div key={group.title} className="space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic underline decoration-indigo-600 decoration-2 underline-offset-4">{group.title}</h4>
                 <div className="flex flex-col gap-4">
                   {group.links.map(l => (
                     <a key={l} href="#" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors">{l}</a>
                   ))}
                 </div>
               </div>
             ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
           <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">© {new Date().getFullYear()} SOCIALFLOW TECH PROTOCOL. ALL RIGHTS RESERVED.</span>
           <div className="flex items-center gap-8">
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity cursor-pointer">
                 <MessageCircle className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity cursor-pointer">
                 <Briefcase className="w-4 h-4" />
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};
