import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Landmark, 
  Zap, 
  ShieldCheck,
  Check,
  Globe,
  Cpu,
  BarChart4,
  Search,
  Layers,
  ChevronRight,
  ExternalLink,
  Code
} from "lucide-react";
import { 
  EliteButton as Button, 
  EliteCard as Card, 
  EliteBadge as Badge 
} from "../components/ui";
import { RadialOrbitalTimelineDemo } from "../components/ui/demo";
import { GradientDots } from "../components/ui/gradient-dots";

/**
 * LandingPage - Originate AI Brand Surface
 * References: Req 6.9, 6.10, 18.1, 18.2, 18.5
 */
export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-base-950 selection:bg-primary/30 selection:text-white font-inter overflow-x-hidden">
      {/* Background Layer - Elite P0 Texture */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[1200px]">
           <GradientDots 
             backgroundColor="#050914" 
             className="opacity-20 scale-150" 
           />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base-950/80 to-base-950" />
        </div>
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-[10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Navbar - Precision Header */}
      <nav className="fixed top-0 z-[100] w-full border-b border-base-800 bg-base-950/60 backdrop-blur-3xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-base-900 border border-base-800 flex items-center justify-center shadow-2xl group-hover:bg-primary group-hover:border-primary transition-all duration-500">
              <Landmark size={20} className="text-white group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-base-50 tracking-tighter leading-none italic">ORIGINATE AI</span>
              <span className="text-[9px] font-black text-primary tracking-[0.3em] mt-1 uppercase">Core Platform</span>
            </div>
          </Link>

          <div className="hidden gap-10 text-[11px] font-black text-base-600 uppercase tracking-[0.2em] md:flex">
            <a href="#capabilities" className="hover:text-base-50 transition-colors flex items-center gap-2 italic">Capabilities</a>
            <a href="#pricing" className="hover:text-base-50 transition-colors italic">Free Access</a>
            <a href="#" className="hover:text-base-50 transition-colors flex items-center gap-1.5 whitespace-nowrap italic">Docs <ExternalLink size={10} /></a>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/auth" className="text-[11px] font-black text-base-400 uppercase tracking-[0.3em] hover:text-primary transition-colors hidden sm:block italic">Sign in</Link>
            <Link to="/auth">
              <Button className="h-11 px-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-elite-primary italic">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - High Velocity */}
      <section className="relative pt-40 lg:pt-52 pb-32 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-10 shadow-lg shadow-primary/5">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">System Status: Online</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-base-50 leading-[0.9] tracking-tighter mb-10 italic uppercase">
              AUTOMATE <br />
              <span className="text-primary not-italic">LENDING</span> <br />
              <span className="text-base-800">INSTANTLY.</span>
            </h1>

            <p className="max-w-xl text-lg text-base-400 leading-relaxed mb-12 font-bold uppercase tracking-wide opacity-80">
              Modern AI infrastructure for fast lending. 
              Deploy clear credit models, manage portfolio risk, and get decisions in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button className="h-16 px-12 text-[11px] font-black uppercase tracking-[0.3em] shadow-elite-primary w-full sm:w-auto italic" rightIcon={<ChevronRight size={18} />}>
                  Create Account
                </Button>
              </Link>
              <Button variant="secondary" className="h-16 px-12 text-[11px] font-black uppercase tracking-[0.3em] w-full sm:w-auto border-base-800 bg-base-900/50 hover:bg-base-800 italic" leftIcon={<Zap size={18} className="text-primary" fill="currentColor" />}>
                View Demo
              </Button>
            </div>

            <div className="mt-16 flex items-center gap-8 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
               <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-base-50" />
                  <span className="text-[11px] font-black text-base-50 uppercase tracking-widest">SOC2 COMPLIANT</span>
               </div>
               <div className="flex items-center gap-2">
                  <Globe size={20} className="text-base-50" />
                  <span className="text-[11px] font-black text-base-50 uppercase tracking-widest">GLOBAL COMPUTE</span>
               </div>
               <div className="flex items-center gap-4 border-l border-base-800 pl-8">
                  <span className="text-2xl font-black text-base-50 tracking-tighter italic">Stripe</span>
                  <span className="text-[10px] font-black text-base-700 uppercase tracking-widest mt-1">PARTNER</span>
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-20 bg-primary/20 blur-[150px] rounded-full opacity-40 animate-pulse" />
            
            <Card border className="p-0 border-base-800 bg-base-900/40 shadow-2xl backdrop-blur-3xl overflow-hidden rotate-[-2deg] hover:rotate-0 transition-all duration-700 group">
               <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
               
               <div className="flex items-center justify-between p-6 border-b border-base-800 bg-base-950/50">
                  <div className="flex gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-danger/50" />
                     <div className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                     <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
                  </div>
                  <div className="text-[10px] font-black text-base-700 uppercase tracking-[0.3em] italic">API Explorer</div>
                  <div className="flex items-center gap-3">
                     <Code size={14} className="text-primary" />
                     <span className="text-[10px] font-black text-primary font-mono lowercase tracking-tighter">Result.json</span>
                  </div>
               </div>
               <div className="p-10 font-mono">
                  <div className="flex items-center gap-4 mb-10">
                     <Badge tone="primary" className="text-[10px] font-black px-4 py-1 tracking-widest">POST</Badge>
                     <span className="text-[12px] font-black text-base-600 tracking-wider">/v2/predict/credit-risk</span>
                  </div>
                  
                  <div className="space-y-3 text-[14px] leading-relaxed">
                     <div className="text-primary/60">{`{`}</div>
                     <div className="flex gap-6">
                        <div className="w-8 text-base-800 text-right select-none font-black italic">04</div>
                        <div className="flex-1 text-base-700 italic"><span className="text-base-100 font-black">"applicant"</span>: {`{`}</div>
                     </div>
                     <div className="flex gap-6 pl-6 text-success">
                        <div className="w-8 text-base-800 text-right select-none font-black italic">05</div>
                        <div className="flex-1"><span className="text-base-100 font-black">"gross_income"</span>: <span className="text-primary italic font-black">125000</span>,</div>
                     </div>
                     <div className="flex gap-6 pl-6 text-success">
                        <div className="w-8 text-base-800 text-right select-none font-black italic">06</div>
                        <div className="flex-1"><span className="text-base-100 font-black">"bureau_score"</span>: <span className="text-primary italic font-black">792</span></div>
                     </div>
                     <div className="flex gap-6">
                        <div className="w-8 text-base-800 text-right select-none font-black italic">07</div>
                        <div className="flex-1 text-base-700">{`},`}</div>
                     </div>
                     <div className="flex gap-6">
                        <div className="w-8 text-base-800 text-right select-none font-black italic">08</div>
                        <div className="flex-1"><span className="text-base-100 font-black">"explain"</span>: <span className="text-primary italic font-black">true</span>,</div>
                     </div>
                     <div className="text-primary/60">{`}`}</div>
                  </div>

                  <div className="mt-12 pt-10 border-t border-base-800 flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-base-700 uppercase tracking-widest mb-1.5">Status Code</span>
                        <span className="text-xs font-black text-success uppercase tracking-wider flex items-center gap-1.5 italic">
                           <Check size={14} strokeWidth={4} /> 200 OK
                        </span>
                     </div>
                     <div className="flex flex-col text-right">
                        <span className="text-[10px] font-black text-base-700 uppercase tracking-widest mb-1.5 italic">Result</span>
                        <span className="text-xs font-black text-base-50 uppercase tracking-wider italic flex items-center gap-3">
                           <Zap size={14} className="text-primary" fill="currentColor" /> Approved • 99.8%
                        </span>
                     </div>
                  </div>
               </div>
            </Card>

            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -bottom-8 -right-8 p-8 bg-base-950/80 backdrop-blur-2xl border border-primary/20 rounded-[32px] shadow-2xl flex items-center gap-5 z-20 group hover:border-primary/50 transition-all"
            >
               <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} />
               </div>
                <div>
                   <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.3em] mb-1">Compliance Status</p>
                   <p className="text-base font-black text-base-50 tracking-tight italic uppercase leading-none">Verified History</p>
                </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities Section - Structural Matrix */}
      <section id="capabilities" className="relative py-44 border-t border-base-800 bg-base-950 overflow-hidden">
        <div className="mx-auto max-w-7xl px-10 mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-8 italic">Core Infrastructure</p>
            <h2 className="text-5xl lg:text-7xl font-black text-base-50 tracking-tighter leading-[0.9] uppercase italic">
              ENGINEERED FOR <br/> <span className="text-primary not-italic">ABSOLUTE PRECISION.</span>
            </h2>
            <p className="mt-8 text-lg text-base-500 max-w-2xl mx-auto font-black uppercase tracking-wider italic opacity-60 leading-relaxed">
              Main platform for loan decisions. Automate your process with clear AI results.
            </p>
          </motion.div>
        </div>

        <div className="mx-auto max-w-7xl px-10 grid md:grid-cols-3 gap-10 mb-24">
           <FeatureCard 
             icon={Cpu} 
             title="Automated Underwriting" 
             desc="Deploy neural decision trees that synthesize applicant data in milliseconds with zero human intervention required." 
           />
           <FeatureCard 
             icon={Search} 
             title="Clear AI Details" 
             desc="Every decision includes a full report, showing exactly why a loan was approved or rejected." 
           />
           <FeatureCard 
             icon={BarChart4} 
             title="Live Monitoring" 
             desc="Monitor your entire loan list with real-time updates and automated accuracy checks." 
           />
        </div>

        <div className="w-full opacity-60 hover:opacity-100 transition-opacity duration-1000">
           <RadialOrbitalTimelineDemo />
        </div>
      </section>

      {/* Free Access Section */}
      <section id="pricing" className="py-44 border-t border-base-800 relative bg-base-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)]" />
        
        <div className="mx-auto max-w-6xl px-10 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-7xl font-black text-base-50 tracking-tighter italic uppercase">Free <span className="text-primary not-italic">Forever.</span></h2>
            <p className="mt-8 text-lg text-base-500 max-w-2xl mx-auto font-bold uppercase tracking-wider italic opacity-80 leading-relaxed">
              Full access to every feature. No credit cards. No limits. Just build.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card border padded className="relative flex flex-col shadow-2xl transition-all overflow-hidden group border-primary/40 bg-primary/[0.03] text-center">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              
              <div className="mb-12">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3 italic">All Features Included</p>
                <h3 className="text-5xl font-black text-base-50 uppercase italic tracking-tighter leading-none">$0</h3>
                <p className="mt-3 text-[11px] font-black text-base-700 uppercase tracking-[0.2em] italic">Unlimited Access</p>
              </div>
              
              <div className="space-y-6 mb-14 text-left max-w-sm mx-auto">
                {["Dashboard & Analytics", "Custom AI Models", "Fraud Detection", "Explainable AI Reports", "Batch Predictions", "Priority Support"].map(f => (
                  <div key={f} className="flex items-center gap-5 group/item">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-base-950 border border-base-800 text-success shadow-inner group-hover/item:border-success/30 transition-all">
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-black text-base-600 uppercase tracking-widest italic group-hover/item:text-base-50 transition-colors leading-none">{f}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/auth">
                <Button className="w-full h-16 text-[11px] font-black uppercase tracking-[0.3em] shadow-elite-primary italic">
                  Get Started Free
                </Button>
              </Link>
            </Card>
          </div>

          <div className="mt-24 p-12 bg-base-900/30 border border-base-800 rounded-[40px] text-center backdrop-blur-3xl shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
             <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.4em] italic">Trusted by teams processing millions in loan volume.</p>
          </div>
        </div>
      </section>

      {/* Footer - Precision Baseline */}
      <footer className="border-t border-base-800 py-28 bg-[#02050b]">
        <div className="mx-auto max-w-7xl px-10">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
             <div className="col-span-2 space-y-10">
                <Link to="/" className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-xl bg-base-900 border border-base-800 flex items-center justify-center shadow-2xl">
                    <Landmark size={20} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-base-50 tracking-tighter leading-none italic">ORIGINATE AI</span>
                    <span className="text-[9px] font-black text-primary tracking-[0.4em] mt-1 uppercase">Lending Platform</span>
                  </div>
                </Link>
                <p className="text-sm text-base-600 max-w-sm leading-relaxed font-bold uppercase tracking-wider italic opacity-80">
                  The mission-critical infrastructure for the automated lending economy. 
                  Built in Mumbai, deployed to the global edge.
                </p>
                <div className="flex gap-8">
                   <div className="h-12 w-12 rounded-2xl border border-base-800 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"><Globe size={20} className="text-base-700 group-hover:text-primary transition-colors" /></div>
                   <div className="h-12 w-12 rounded-2xl border border-base-800 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"><Layers size={20} className="text-base-700 group-hover:text-primary transition-colors" /></div>
                </div>
             </div>
             
             <div className="space-y-8">
                <h4 className="text-[11px] font-black text-base-50 uppercase tracking-[0.3em] italic">Product</h4>
                <ul className="space-y-4 text-[13px] font-black text-base-700">
                   <li className="hover:text-primary cursor-pointer transition-all uppercase tracking-[0.2em] italic">Decision Engine</li>
                   <li className="hover:text-primary cursor-pointer transition-all uppercase tracking-[0.2em] italic">Model Registry</li>
                   <li className="hover:text-primary cursor-pointer transition-all uppercase tracking-[0.2em] italic">Compliance API</li>
                   <li className="hover:text-primary cursor-pointer transition-all uppercase tracking-[0.2em] italic">Cloud Dashboard</li>
                </ul>
             </div>

             <div className="space-y-8">
                <h4 className="text-[11px] font-black text-base-50 uppercase tracking-[0.3em] italic">Company</h4>
                <ul className="space-y-4 text-[13px] font-black text-base-700">
                    <li className="hover:text-base-50 cursor-pointer transition-all uppercase tracking-[0.2em] italic">Security</li>
                    <li className="hover:text-base-50 cursor-pointer transition-all uppercase tracking-[0.2em] italic">Legal</li>
                    <li className="hover:text-base-50 cursor-pointer transition-all uppercase tracking-[0.2em] italic">Brand Kit</li>
                    <li className="hover:text-base-50 cursor-pointer transition-all uppercase tracking-[0.2em] italic">Contact Us</li>
                </ul>
             </div>
          </div>

          <div className="pt-12 border-t border-base-800 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black text-base-800 uppercase tracking-[0.4em] italic">
              &copy; 2026 ORIGINATE AI SYSTEMS. OPERATING WITH INTEGRITY.
            </p>
            <div className="flex gap-12 text-[10px] font-black text-base-800 uppercase tracking-[0.3em] italic">
              <a href="#" className="hover:text-base-50 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-base-50 transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card border padded className="bg-base-900/20 border-base-800 shadow-xl group hover:border-primary/20 transition-all">
       <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-10 group-hover:scale-110 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
          <Icon size={28} />
       </div>
       <h3 className="text-xl font-black text-base-50 uppercase italic tracking-tight mb-5">{title}</h3>
       <p className="text-sm text-base-500 leading-relaxed font-bold uppercase tracking-wider italic opacity-80">{desc}</p>
    </Card>
  );
}

