import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Search, Brain, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-black text-white">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-brand-primary-mid rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-brand-primary-void rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          {t('home.heroTitle1')} <br />
          <span className="text-brand-primary">{t('home.heroTitle2')}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
        >
          {t('home.heroSubtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col md:flex-row gap-4 justify-center"
        >
          <Link to="/signup" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
            {t('home.getStarted')} <ArrowRight size={20} />
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-black">
            {t('home.signIn')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

const Home = () => {
  const { t } = useTranslation();
  const features = [
    { id: 'smartSearch' as const, icon: Search },
    { id: 'aiMatching' as const, icon: Brain },
    { id: 'bilingual' as const, icon: Globe },
  ];

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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('home.whyTitle')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">{t('home.whySubtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="text-center p-8 rounded-3xl border border-gray-50 transition-colors hover:border-brand-primary/40 bg-white"
              >
                <div
                  className={`mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl transform transition-transform group-hover:rotate-6 ${
                    feature.id === 'aiMatching'
                      ? 'text-white shadow-md'
                      : 'bg-brand-primary/10 text-brand-primary'
                  }`}
                  style={
                    feature.id === 'aiMatching'
                      ? {
                          backgroundImage:
                            'linear-gradient(145deg, var(--color-ai-indigo), var(--color-ai-violet), var(--color-ai-cyan))',
                        }
                      : undefined
                  }
                >
                  <feature.icon size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  {feature.id === 'smartSearch'
                    ? t('home.featureSmartSearchTitle')
                    : feature.id === 'aiMatching'
                      ? t('home.featureAiTitle')
                      : t('home.featureBilingualTitle')}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.id === 'smartSearch'
                    ? t('home.featureSmartSearchDesc')
                    : feature.id === 'aiMatching'
                      ? t('home.featureAiDesc')
                      : t('home.featureBilingualDesc')}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-brand-black text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary/10 blur-3xl rounded-full translate-x-1/2"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                {t('home.ctaTitle')} <span className="text-brand-primary">{t('home.ctaTitleAccent')}</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 leading-relaxed">{t('home.ctaSubtitle')}</p>
              <Link to="/signup" className="btn-primary text-xl px-10 py-5 inline-flex items-center gap-3">
                {t('home.createFreeAccount')} <ArrowRight size={24} />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="flex-1 w-full"
            >
              <div className="aspect-square rounded-full border-2 border-brand-primary/30 flex items-center justify-center relative">
                <div className="absolute inset-0 animate-spin-slow border-t-2 border-brand-primary rounded-full"></div>
                <Brain size={160} className="text-brand-primary animate-pulse" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
