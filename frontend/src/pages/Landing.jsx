import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, BookOpen, FileText, Lock, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { api } from "../utils/api";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-cyber-cyan" />,
      title: "Automated FIR Drafting",
      description: "Instantly draft structured legal First Information Reports adhering strictly to BNSS Section 173 formats."
    },
    {
      icon: <BookOpen className="h-6 w-6 text-blue-400" />,
      title: "Legal Intelligence Retrieval",
      description: "Query and extract relevant references across Bharatiya Nyaya Sanhita (BNS), BNSS, and Bharatiya Sakshya Adhiniyam (BSA)."
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-400" />,
      title: "Electronic Seizure Compliance",
      description: "Generate digital audit checklists matching video recording mandates under BNSS 105 and BSA 63 certificates."
    },
    {
      icon: <Lock className="h-6 w-6 text-emerald-400" />,
      title: "Chain of Custody Logs",
      description: "Cryptographically traceable local user logs that maintain system actions and records integrity for courtroom trials."
    }
  ];

  const handlePortalAccess = () => {
    if (api.isAuthenticated()) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="relative min-h-screen bg-cyber-grid overflow-hidden pb-12">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-police-600/10 blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyber-cyan/5 blur-[150px]" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-20 md:pt-32 relative z-10 flex flex-col items-center">
        {/* Header Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center space-x-2 px-3 py-1 rounded-full bg-police-800/60 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono tracking-wider mb-6"
        >
          <span className="h-2 w-2 rounded-full bg-cyber-cyan animate-pulse"></span>
          <span>CRIMINAL LAWS REFORM 2023 COMPLIANT (BNS/BNSS/BSA)</span>
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white font-sans leading-none mb-6">
            AI-Powered Legal Intelligence <br />
            <span className="bg-gradient-to-r from-cyber-cyan via-blue-400 to-purple-400 bg-clip-text text-transparent">
              For Modern Police Forces
            </span>
          </h1>
          <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed mb-10">
            CrimeGPT automates documentation, legal reference lookups, and evidence compliance lists so investigators can focus on resolving crimes faster.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-20 justify-center w-full max-w-md"
        >
          <button
            onClick={handlePortalAccess}
            className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-police-600 to-cyber-cyan text-white font-bold hover:shadow-cyber-glow transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
          >
            <span>Access Officer Portal</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("features");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center justify-center space-x-1 px-8 py-4 rounded-xl glass-panel text-slate-300 font-semibold hover:bg-police-800/40 hover:text-white transition-all cursor-pointer"
          >
            <span>Learn Capabilities</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Mockup Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="w-full max-w-5xl rounded-2xl glass-panel p-2 shadow-glass border-glass-inset mb-32"
        >
          <div className="rounded-xl overflow-hidden bg-police-950/80 border border-police-800/40 aspect-[16/9] relative p-6">
            <div className="flex items-center justify-between border-b border-police-900 pb-3 mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-500">OFFICER INVESTIGATION SYSTEM - SHIELD v2026.04</span>
              <div className="w-12 h-2 rounded bg-police-800" />
            </div>

            <div className="grid grid-cols-3 gap-4 h-[calc(100%-40px)]">
              {/* Left Case list Mock */}
              <div className="col-span-1 border-r border-police-900 pr-4 space-y-3 font-sans">
                <div className="h-8 rounded bg-police-900 flex items-center px-3 border border-police-800/60 justify-between">
                  <div className="h-2 w-16 bg-slate-600 rounded" />
                  <div className="h-3 w-3 bg-cyber-cyan/50 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-police-800/30 rounded border border-cyber-cyan/20">
                    <div className="h-3 w-32 bg-slate-400 rounded mb-2" />
                    <div className="h-2 w-full bg-slate-600 rounded" />
                  </div>
                  <div className="p-3 bg-police-900/20 rounded">
                    <div className="h-3 w-24 bg-slate-500 rounded mb-2" />
                    <div className="h-2 w-20 bg-slate-600/60 rounded" />
                  </div>
                </div>
              </div>

              {/* Center / Right Analysis Mock */}
              <div className="col-span-2 space-y-4">
                <div className="h-10 rounded bg-police-900/80 flex items-center px-4 justify-between border border-police-800/40">
                  <div className="h-3 w-48 bg-slate-400 rounded" />
                  <div className="h-5 w-24 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono rounded flex items-center justify-center">
                    BNS COMPLIANT
                  </div>
                </div>
                <div className="space-y-2 max-h-[80%] overflow-hidden">
                  <div className="h-3 w-full bg-slate-700/55 rounded" />
                  <div className="h-3 w-[95%] bg-slate-700/55 rounded" />
                  <div className="h-3 w-[70%] bg-slate-700/55 rounded" />
                  <div className="border border-police-800 bg-police-900/10 p-3 rounded mt-4">
                    <div className="h-2.5 w-32 bg-cyber-cyan/40 rounded mb-2" />
                    <div className="h-2 w-[90%] bg-slate-600/40 rounded mb-1" />
                    <div className="h-2 w-[85%] bg-slate-600/40 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <div id="features" className="w-full max-w-6xl pt-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Designed For High-Speed Documentation
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Built to optimize law enforcement operations during critical cyber and criminal investigation procedures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="rounded-2xl glass-panel p-6 border-glass-inset glass-panel-hover flex flex-col justify-between"
              >
                <div>
                  <div className="mb-4 p-3 bg-police-800/40 rounded-xl w-fit border border-police-700/30">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
