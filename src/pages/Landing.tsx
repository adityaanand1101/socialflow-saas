import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { useAuth } from "@clerk/react";
import { 
  Sparkles, 
  TrendingUp, 
  Calendar,
  Cpu,
  Database,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  Star,
  Zap,
  Share2,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Constants ---
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// --- Sub-components ---

const Navbar = () => {
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500 py-6 px-8",
      isScrolled ? "bg-navy-900/80 backdrop-blur-xl border-b border-white/5 py-4" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white italic">SocialFlow</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {["Platform", "Features", "Reviews", "Pricing", "FAQ"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to={isSignedIn ? "/app" : "/sign-in"}>
            <Button variant="ghost" className="text-gray-300 hover:text-white text-xs font-bold uppercase tracking-widest">
              {isSignedIn ? "Dashboard" : "Login"}
            </Button>
          </Link>
          <Link to={isSignedIn ? "/app" : "/sign-up"}>
            <Button className="bg-gradient-primary text-white hover:opacity-90 px-6 rounded-lg text-xs font-bold uppercase tracking-widest shadow-glow border-none">
              {isSignedIn ? "Go to App" : "Start Free"}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

const PlatformMarquee = () => {
  const platforms = [
    { name: "Instagram", color: "text-[#E4405F]" },
    { name: "LinkedIn", color: "text-[#0A66C2]" },
    { name: "X / Twitter", color: "text-white" },
    { name: "Facebook", color: "text-[#1877F2]" },
    { name: "Threads", color: "text-white" },
    { name: "Bluesky", color: "text-[#0085FF]" },
    { name: "Mastodon", color: "text-[#6364FF]" }
  ];

  return (
    <div className="w-full overflow-hidden py-12 border-y border-white/5 bg-white/[0.01] relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-navy-900 to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-navy-900 to-transparent z-10" />
      
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex gap-20 items-center whitespace-nowrap"
      >
        {[...platforms, ...platforms, ...platforms].map((p, i) => (
          <div key={i} className={cn("flex items-center gap-3 text-lg font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity", p.color)}>
            <div className="w-2 h-2 rounded-full bg-current" />
            {p.name}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">{question}</span>
        <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-400 leading-relaxed max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReviewCard = ({ name, role, content, rating = 5 }: any) => (
  <div className="p-8 rounded-3xl glass-morphism border border-white/10 space-y-6 min-w-[350px] max-w-[350px]">
    <div className="flex gap-1 text-yellow-500">
      {[...Array(rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
    </div>
    <p className="text-gray-300 font-medium leading-relaxed italic">"{content}"</p>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-primary flex-shrink-0" />
      <div>
        <p className="text-sm font-bold text-white">{name}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{role}</p>
      </div>
    </div>
  </div>
);

const BentoFeature = ({ icon: Icon, title, desc, className, delay = 0 }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={cn(
        "p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group overflow-hidden relative",
        className
      )}
    >
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-primary opacity-[0.03] group-hover:opacity-[0.08] blur-3xl transition-opacity" />
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-indigo-400" />
      </div>
      <h3 className="text-2xl font-black tracking-tight text-white mb-3 uppercase">{title}</h3>
      <p className="text-gray-400 text-sm font-medium leading-relaxed">{desc}</p>
    </motion.div>
  );
};

export const LandingPage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroRotate = useTransform(scrollYProgress, [0, 0.2], [0, 2]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/app");
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden antialiased">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-pink-600/10 rounded-full blur-[150px]" />
      </div>

      <Navbar />

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative pt-44 pb-32 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: EASE }}
              className="space-y-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em]">
                <Zap className="w-3.5 h-3.5 fill-indigo-400" />
                <span>Next-Gen Content Automation</span>
              </div>
              
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white italic">
                AUTOMATE <br />
                <span className="text-transparent bg-clip-text bg-gradient-primary">
                  DOMINANCE.
                </span>
              </h1>

              <p className="text-xl text-gray-400 max-w-xl leading-relaxed font-medium">
                The all-in-one command center to schedule content, synthesize viral captions with AI, and dominate X, Instagram, and LinkedIn in one protocol.
              </p>

              <div className="flex flex-wrap items-center gap-5 pt-4">
                <Link to="/sign-up">
                  <Button size="lg" className="h-16 px-10 text-base bg-gradient-primary rounded-xl font-black uppercase tracking-widest shadow-glow hover:opacity-90 transition-all active:scale-95">
                    Launch Free Trial <ArrowRight className="ml-3 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="ghost" className="h-16 px-8 text-base text-gray-400 hover:text-white font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-xl backdrop-blur-md">
                  Watch intelligence demo
                </Button>
              </div>
            </motion.div>

            {/* Browser Mockup */}
            <motion.div 
              style={{ scale: heroScale, rotateX: heroRotate }}
              className="relative group hidden lg:block"
            >
               <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] -z-10" />
               <div className="rounded-3xl border border-white/10 bg-[#0F1117] p-3 shadow-2xl">
                  <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                     <div className="h-10 bg-white/5 flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                           <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                           <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                           <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                        </div>
                        <div className="flex-1 h-6 bg-white/5 rounded-md mx-8" />
                     </div>
                     <div className="p-8 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                           {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                        </div>
                        <div className="h-48 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5 flex items-center justify-center">
                           <Sparkles className="w-12 h-12 text-indigo-500/20" />
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </section>

        {/* 2. MARQUEE SECTION */}
        <PlatformMarquee />

        {/* 3. CORE FEATURES: BENTO GRID */}
        <section id="features" className="py-40 px-6">
          <div className="max-w-7xl mx-auto space-y-24">
             <div className="text-center space-y-6">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic">Built for the Elite.</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">Stop wasting hours on manual posting. Our neural layer handles the complexity while you focus on the vision.</p>
             </div>

             <div className="grid md:grid-cols-6 gap-6">
                <BentoFeature 
                  className="md:col-span-4"
                  icon={Cpu}
                  title="AI Studio 2.0"
                  desc="Replicate your brand's semantic signature. Fine-tuned LLMs that generate threads, captions, and hashtags that match your specific voice and humor."
                />
                <BentoFeature 
                  className="md:col-span-2"
                  icon={Calendar}
                  title="Visual Queue"
                  desc="A high-performance visual timeline to orchestrate multi-platform campaigns with millisecond precision."
                />
                <BentoFeature 
                  className="md:col-span-3"
                  icon={TrendingUp}
                  title="Predictive Intel"
                  desc="Stop guessing. Our engine predicts engagement based on real-time global social signals."
                />
                <BentoFeature 
                  className="md:col-span-3"
                  icon={ShieldCheck}
                  title="Vault-Grade Security"
                  desc="Social tokens are encrypted with military-grade protocols and media is stored on B2 infrastructure."
                />
             </div>
          </div>
        </section>

        {/* 4. INTERACTIVE PREVIEWER */}
        <section className="py-32 px-6 bg-white/[0.01] border-y border-white/5">
           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <h2 className="text-5xl md:text-6xl font-black tracking-tighter italic leading-none">POST SYNTHESIS <br />IN REAL TIME.</h2>
                 <div className="space-y-10">
                    {[
                      { icon: MessageSquare, title: "Tone Calibration", desc: "Choose between Professional, Viral, Sarcastic, or Technical styles." },
                      { icon: Share2, title: "Multi-Sync", desc: "Preview exactly how your post looks on X vs Instagram instantly." },
                      { icon: Database, title: "Media Relay", desc: "Sync your Backblaze library directly into your post compositions." }
                    ].map((f, i) => (
                      <div key={i} className="flex gap-6">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                           <f.icon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-lg font-bold text-white">{f.title}</h4>
                           <p className="text-gray-400 text-sm font-medium leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="p-8 rounded-[3rem] glass-morphism border border-white/10 bg-navy-900/50 shadow-glow relative">
                 <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-primary rounded-full blur-[60px]" />
                 <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Post Intelligence Preview</span>
                       <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div className="w-2 h-2 rounded-full bg-white/10" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="h-4 w-1/3 bg-white/10 rounded-full" />
                       <div className="p-6 rounded-2xl bg-white/5 border border-white/5 italic text-gray-300 leading-relaxed font-medium">
                          "Social media growth isn't about working harder. It's about building an autonomous protocol that replicates your brand 24/7."
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-indigo-400">Schedule: Tomorrow 10AM</div>
                          <div className="h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-500">Add to Queue</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* 5. REVIEWS / TESTIMONIALS */}
        <section id="reviews" className="py-40 px-6 relative overflow-hidden">
           <div className="max-w-7xl mx-auto space-y-20">
              <div className="flex flex-col md:flex-row items-end justify-between gap-8">
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none">THE INDUSTRY <br />CONSENSUS.</h2>
                 <div className="flex gap-4">
                    <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 h-12 w-12 p-0"><ChevronLeft className="w-5 h-5"/></Button>
                    <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 h-12 w-12 p-0"><ChevronRight className="w-5 h-5"/></Button>
                 </div>
              </div>

              <div className="flex gap-8 overflow-x-hidden pb-12 cursor-grab active:cursor-grabbing">
                 {[
                   { name: "Alex Rivera", role: "Growth Lead @ TechScale", content: "SocialFlow is the first tool that actually sounds like me. The AI tone calibration is unreal." },
                   { name: "Sarah Chen", role: "Indie Maker", content: "I saved 15 hours a week using the autonomous scheduling engine. It paid for itself in two days." },
                   { name: "Marcus Thorne", role: "Agency Founder", content: "Managing 20+ client accounts used to be a nightmare. Now it's a synchronized protocol." },
                   { name: "Elena Vogt", role: "SaaS Marketing", content: "The level of security and integration with Backblaze/Supabase makes this a no-brainer for serious brands." }
                 ].map((r, i) => <ReviewCard key={i} {...r} />)}
              </div>
           </div>
        </section>

        {/* 6. PRICING SECTION */}
        <section id="pricing" className="py-40 px-6 bg-[#010101]">
           <div className="max-w-5xl mx-auto text-center space-y-24">
              <div className="space-y-6">
                 <h2 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase text-white">Select Access.</h2>
                 <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px]">Commercial grade protocols for every scale</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {[
                   { name: "Starter", price: "0", features: ["3 Social Channels", "Visual Scheduler", "Standard AI"] },
                   { name: "Professional", price: "29", features: ["15 Social Channels", "AI Tone Calibration", "Neural Analytics", "Priority Support"], popular: true },
                   { name: "Elite", price: "99", features: ["Infinite Channels", "API Access", "Custom AI Fine-tuning", "White Labeling"] }
                 ].map((p, i) => (
                   <div key={i} className={cn(
                     "p-10 rounded-[3rem] border flex flex-col justify-between transition-all relative group",
                     p.popular ? "bg-[#0F1117] border-indigo-500 shadow-glow scale-105 z-10" : "bg-white/[0.02] border-white/5"
                   )}>
                      {p.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[8px] font-black uppercase px-4 py-1 rounded-full tracking-widest shadow-glow">Most Active</div>}
                      <div className="space-y-8">
                        <div>
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 italic">{p.name}</h3>
                           <div className="flex items-baseline justify-center gap-1">
                              <span className="text-6xl font-black tracking-tighter text-white italic">${p.price}</span>
                              <span className="text-sm font-bold text-gray-500">/mo</span>
                           </div>
                        </div>
                        <ul className="space-y-4 text-left">
                           {p.features.map(f => (
                             <li key={f} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-gray-300">
                                <CheckCircle2 className="w-4 h-4 text-indigo-500" strokeWidth={3} /> {f}
                             </li>
                           ))}
                        </ul>
                      </div>
                      <Link to="/sign-up" className="mt-12">
                         <Button className={cn(
                           "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl",
                           p.popular ? "bg-gradient-primary text-white border-none" : "bg-white/5 text-white hover:bg-white/10"
                         )}>
                           Initialize {p.name}
                         </Button>
                      </Link>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 7. FAQ SECTION */}
        <section id="faq" className="py-40 px-6 border-t border-white/5">
           <div className="max-w-4xl mx-auto space-y-16">
              <h2 className="text-5xl font-black tracking-tighter italic uppercase text-white">Intelligence FAQ.</h2>
              <div className="space-y-2">
                 <FAQItem 
                   question="How does the AI understand my brand voice?" 
                   answer="Our Neural Tone Mapping engine analyzes your previous content to identify recurring semantic patterns, humor, and specific industry vocabulary. You can also manually fine-tune the calibration in the AI Studio."
                 />
                 <FAQItem 
                   question="Can I manage multiple teams or workspaces?" 
                   answer="Yes, the Elite tier allows you to create unlimited workspaces. Each workspace has isolated media storage (Backblaze B2) and independent social credentials."
                 />
                 <FAQItem 
                   question="Which social platforms are currently supported?" 
                   answer="Currently we support X (Twitter), LinkedIn, and Instagram. Facebook, Threads, and Bluesky are in early access for Elite members."
                 />
                 <FAQItem 
                   question="Is my data secure?" 
                   answer="Absolutely. All social tokens are encrypted at rest using AES-256. We utilize Supabase's hardened Postgres infrastructure and Backblaze B2 for secure file hosting."
                 />
              </div>
           </div>
        </section>

        {/* 8. FINAL CTA BANNER */}
        <section className="py-40 px-6">
           <div className="max-w-6xl mx-auto rounded-[4rem] bg-gradient-primary p-1 rounded-3xl relative group overflow-hidden shadow-glow">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000" />
              <div className="bg-[#020617] rounded-[calc(4rem-4px)] p-20 text-center space-y-10 relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-600/10 blur-[150px] -z-10 rounded-full" />
                 <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none italic uppercase">Ready for <br />Infinite Scale?</h2>
                 <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px]">The protocol is waiting for your initialization.</p>
                 <div className="flex flex-col items-center gap-6">
                    <Link to="/sign-up">
                      <Button size="lg" className="h-16 px-16 text-xl bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-transform active:scale-95">
                        Begin Now
                      </Button>
                    </Link>
                    <div className="flex items-center gap-4 text-gray-500">
                       <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> No Credit Card</div>
                       <div className="w-1 h-1 rounded-full bg-white/20" />
                       <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant Access</div>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      {/* 9. FOOTER */}
      <footer className="py-24 px-12 border-t border-white/5 bg-[#010101]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-16">
          <div className="col-span-2 space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white italic">SocialFlow.</span>
            </div>
            <p className="text-gray-500 max-w-sm text-xs font-bold uppercase tracking-widest leading-loose">
              Synthesizing brand intelligence for the next generation of social media dominance. Secure, autonomous, and engineered for high-frequency reach.
            </p>
            <div className="flex gap-6 opacity-30 grayscale transition-all hover:opacity-100 hover:grayscale-0">
               <MessageSquare className="w-5 h-5 cursor-pointer hover:text-white" />
               <TrendingUp className="w-5 h-5 cursor-pointer hover:text-white" />
               <Sparkles className="w-5 h-5 cursor-pointer hover:text-white" />
               <Globe className="w-5 h-5 cursor-pointer hover:text-white" />
            </div>
          </div>

          {[
            { title: "Protocol", links: ["AI Studio", "Visual Queue", "Intel Engine", "Security Vault"] },
            { title: "Network", links: ["X / Twitter", "Instagram", "LinkedIn", "Facebook"] },
            { title: "Company", links: ["Privacy", "Terms", "Documentation", "Contact"] }
          ].map(g => (
            <div key={g.title} className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic underline decoration-indigo-600 decoration-4 underline-offset-8">{g.title}</h4>
              <div className="flex flex-col gap-4">
                {g.links.map(l => (
                  <a key={l} href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-400 transition-all">{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
           <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">© {new Date().getFullYear()} SOCIALFLOW TECH PROTOCOL. ALL RIGHTS RESERVED.</span>
           <div className="flex items-center gap-8 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
              <span className="hover:text-white cursor-pointer transition-colors">Server Status: Online</span>
              <span className="hover:text-white cursor-pointer transition-colors">API v2.4</span>
           </div>
        </div>
      </footer>
    </div>
  );
};
