import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Animated counter component
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const numericTarget = parseInt(target.replace(/[^0-9]/g, ''));
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numericTarget));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  const formatCount = () => {
    if (target.includes(',')) {
      return count.toLocaleString() + suffix;
    }
    return count + suffix;
  };

  return <span ref={ref}>{formatCount()}</span>;
}

// Section header component for consistency
function SectionHeader({ label, labelColor = 'text-blue-400', title, highlight, highlightGradient = 'from-blue-400 to-cyan-400', subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-14"
    >
      <span className={`inline-block text-xs font-semibold ${labelColor} uppercase tracking-[0.2em] mb-4`}>{label}</span>
      <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
        {title}{' '}
        {highlight && (
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${highlightGradient}`}>
            {highlight}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="text-base text-gray-500 max-w-lg mx-auto leading-relaxed">{subtitle}</p>
      )}
    </motion.div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
      title: 'Learning Roadmaps',
      description: 'Personalized paths aligned to your career goals',
      link: '/roadmap',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
      title: 'AI Assessments',
      description: 'Intelligent skill evaluation tailored to your level',
      link: '/assessment',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      ),
      title: 'Mock Interviews',
      description: 'Practice with AI-driven realistic interview scenarios',
      link: '/interview-landing',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      ),
      title: 'Coding Arena',
      description: 'Solve real-world problems with instant AI feedback',
      link: '/coding',
    }
  ];

  const stats = [
    { number: '10,000', suffix: '+', label: 'Students', description: 'Actively learning' },
    { number: '95', suffix: '%', label: 'Success Rate', description: 'Career placement' },
    { number: '500', suffix: '+', label: 'Companies', description: 'Trust our platform' },
    { number: '50', suffix: '+', label: 'Domains', description: 'Tech specializations' }
  ];

  const whyChooseItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      title: 'Lightning Fast',
      desc: 'Get instant AI-generated assessments and feedback in seconds'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      ),
      title: 'Precision Analytics',
      desc: 'AI identifies your exact skill gaps and delivers targeted improvements'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
      title: 'Adaptive Learning',
      desc: 'Content evolves dynamically to match your pace and learning style'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      title: 'Industry-Ready',
      desc: 'Prepare with challenges sourced from top tech companies worldwide'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
      title: 'Career Growth',
      desc: 'Custom roadmaps designed specifically around your career ambitions'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
        </svg>
      ),
      title: 'Proven Results',
      desc: '95% of our users successfully transition into their desired roles'
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer at Google',
      image: 'https://i.pravatar.cc/150?img=1',
      text: 'CareerPath helped me land my dream job! The interview practice was invaluable and incredibly realistic.'
    },
    {
      name: 'Michael Chen',
      role: 'Full Stack Developer',
      image: 'https://i.pravatar.cc/150?img=12',
      text: 'The personalized roadmap guided me from beginner to professional in just 6 months. Truly transformative.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Data Scientist at Amazon',
      image: 'https://i.pravatar.cc/150?img=5',
      text: 'Best platform for tech career growth. The AI assessments pinpointed exactly what I needed to improve.'
    }
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(to right, #000001, #000000)' }}
    >

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,1) 0%, transparent 70%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-gray-400 text-xs font-medium tracking-wide uppercase">AI-Powered Career Platform</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
            >
              Accelerate Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
                Tech Career
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-base md:text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed"
            >
              Master in-demand skills with AI-powered assessments, personalized
              roadmaps, and realistic interview practice.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-600/20"
                  >
                    Go to Dashboard
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    to="/roadmap"
                    className="px-7 py-3.5 rounded-xl font-semibold text-sm border border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 transition-all duration-300"
                  >
                    Create Roadmap
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-600/20"
                  >
                    Get Started Free
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="px-7 py-3.5 rounded-xl font-semibold text-sm border border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 transition-all duration-300"
                  >
                    Explore Platform
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS BAR ═══════════════════════ */}
      <section className="py-10 border-y border-gray-800/40">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={index}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
                  <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                </div>
                <div className="text-sm font-medium text-gray-400 mb-0.5">{stat.label}</div>
                <div className="text-xs text-gray-600">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section className="py-14">
        <div className="container mx-auto px-6 lg:px-8">
          <SectionHeader
            label="What We Offer"
            title="Everything You Need to"
            highlight="Succeed"
            subtitle="Comprehensive tools designed to accelerate your tech career"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={index}
              >
                <Link
                  to={feature.link}
                  className="group block p-6 rounded-2xl border border-gray-800/50 bg-gray-950/50 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:bg-blue-500/15 group-hover:border-blue-500/30 transition-all duration-300">
                    {feature.icon}
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{feature.description}</p>

                  <span className="inline-flex items-center text-xs font-medium text-blue-400/70 group-hover:text-blue-400 transition-colors duration-300">
                    Learn more
                    <svg className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ WHY CHOOSE US ═══════════════════════ */}
      <section className="py-14 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/0 via-gray-900/20 to-gray-950/0" />
        <div className="container mx-auto px-6 lg:px-8 relative">
          <SectionHeader
            label="Why CareerPath?"
            labelColor="text-cyan-400"
            title="Built for"
            highlight="Excellence"
            highlightGradient="from-cyan-400 to-blue-400"
            subtitle="The tools, insights, and support you need to stand out"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whyChooseItems.map((item, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={index}
                className="group p-6 rounded-2xl border border-gray-800/40 bg-gray-950/30 hover:bg-gray-900/40 hover:border-gray-700/50 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center text-cyan-400 mb-4 group-hover:bg-cyan-500/15 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
      <section className="py-14">
        <div className="container mx-auto px-6 lg:px-8">
          <SectionHeader
            label="Testimonials"
            labelColor="text-emerald-400"
            title="Trusted by"
            highlight="Developers"
            highlightGradient="from-emerald-400 to-cyan-400"
            subtitle="Real stories from people who transformed their careers"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={index}
                className="group p-6 rounded-2xl border border-gray-800/40 bg-gray-950/30 hover:bg-gray-900/30 hover:border-gray-700/50 transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-yellow-500/70" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-gray-400 leading-relaxed mb-6">"{testimonial.text}"</p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-800/40">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-800"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{testimonial.name}</p>
                    <p className="text-xs text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="py-14">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-2xl mx-auto text-center"
          >
            {/* Top line */}
            <div className="w-12 h-px bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-6" />

            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Ready to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Get Started
              </span>
              ?
            </h2>
            <p className="text-base text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              Join thousands of developers building their future with AI-powered learning.
            </p>

            <Link
              to={user ? '/roadmap' : '/login'}
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-600/20"
            >
              {user ? 'Start a Roadmap' : 'Create Free Account'}
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-gray-800/40">
        <div className="container mx-auto px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">CP</span>
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  CareerPath
                </span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed max-w-[200px]">
                AI-powered career acceleration for developers worldwide.
              </p>
            </div>

            {/* Links */}
            {[
              {
                title: 'Product',
                links: [
                  { to: '/assessment', label: 'Assessments' },
                  { to: '/roadmap', label: 'Roadmaps' },
                  { to: '/interview-landing', label: 'Interviews' },
                  { to: '/coding', label: 'Coding Arena' },
                ]
              },
              {
                title: 'Company',
                links: [
                  { to: '#', label: 'About' },
                  { to: '#', label: 'Careers' },
                  { to: '#', label: 'Blog' },
                  { to: '#', label: 'Contact' },
                ]
              },
              {
                title: 'Legal',
                links: [
                  { to: '#', label: 'Privacy' },
                  { to: '#', label: 'Terms' },
                  { to: '#', label: 'Cookies' },
                ]
              }
            ].map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{group.title}</h4>
                <ul className="space-y-2.5">
                  {group.links.map(({ to, label }) => (
                    <li key={label}>
                      <Link to={to} className="text-xs text-gray-600 hover:text-gray-400 transition-colors duration-200">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800/40 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-700 text-xs">
              © {new Date().getFullYear()} CareerPath. All rights reserved.
            </p>
            <div className="flex gap-4">
              {[
                'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z',
                'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z',
                'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'
              ].map((path, i) => (
                <a key={i} href="#" className="text-gray-700 hover:text-gray-500 transition-colors duration-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={path} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}