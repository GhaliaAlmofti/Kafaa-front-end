import React from 'react';
import { motion } from 'motion/react';
import { Search, Brain, Globe, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => (
  <section className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-black text-white">
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-green rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-800 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
    </div>
    
    <div className="container mx-auto px-6 relative z-10 text-center">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-7xl font-bold mb-6"
      >
        Your Career, <br /><span className="text-brand-green">Our Vision</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
      >
        Career Vision is an AI-driven platform designed to connect talented individuals with the best opportunities in Libya. Simple, fast, and effective.
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="flex flex-col md:flex-row gap-4 justify-center"
      >
        <Link to="/signup" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
          Get Started <ArrowRight size={20} />
        </Link>
        <Link to="/login" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-black">
          Sign In
        </Link>
      </motion.div>
    </div>
  </section>
);

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Career Vision?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">We simplify the recruitment process for everyone.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Search, title: "Smart Search", desc: "Find jobs that match your skills perfectly with our AI-powered search engine." },
              { icon: Brain, title: "AI Matching", desc: "Our system analyzes your CV and matches you with the right employers instantly." },
              { icon: Globe, title: "Bilingual Support", desc: "Whether your CV is in Arabic or English, we've got you covered." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="text-center p-8 rounded-3xl border border-gray-50 hover:shadow-2xl hover:shadow-brand-green/5 transition-all bg-white"
              >
                <div className="w-20 h-20 bg-brand-green/10 rounded-3xl flex items-center justify-center text-brand-green mx-auto mb-8 transform group-hover:rotate-6 transition-transform">
                  <feature.icon size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-brand-black text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-green/10 blur-3xl rounded-full translate-x-1/2"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">Ready to transform your <span className="text-brand-green">career path?</span></h2>
              <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                Join thousands of professionals in Libya who have found their dream roles through our intelligent matching ecosystem.
              </p>
              <Link to="/signup" className="btn-primary text-xl px-10 py-5 inline-flex items-center gap-3">
                Create Free Account <ArrowRight size={24} />
              </Link>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="flex-1 w-full"
            >
              <div className="aspect-square rounded-full border-2 border-brand-green/30 flex items-center justify-center relative">
                <div className="absolute inset-0 animate-spin-slow border-t-2 border-brand-green rounded-full"></div>
                <Brain size={160} className="text-brand-green animate-pulse" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
