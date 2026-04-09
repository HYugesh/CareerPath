import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Terminal, Zap, ChevronLeft, ChevronRight, Code2 } from 'lucide-react';
import GeminiCodeArena from './GeminiCodeArena';
import OnlineCompiler from './OnlineCompiler';

const SECTIONS = [
  {
    id: 'arena',
    label: 'CodeArena',
    sublabel: 'AI challenges',
    icon: Zap,
    accent: '#0f766e',
  },
  {
    id: 'compiler',
    label: 'Online Compiler',
    sublabel: 'Write & run code',
    icon: Terminal,
    accent: '#1e40af',
  },
];

export default function CodeArenaShell() {
  const { isDark } = useTheme();
  const [active, setActive] = useState('arena');
  const [collapsed, setCollapsed] = useState(false);

  const sidebarW = collapsed ? 52 : 200;

  const sidebarBg = isDark
    ? 'bg-[#0a0e14] border-r border-gray-800'
    : 'bg-white border-r border-gray-200 shadow-sm';

  const toggleBtnCls = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
    : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800';

  const [isFullscreen, setIsFullscreen] = useState(false);
    useEffect(() => {
      const observer = new MutationObserver(() => {
        const hasClass = document.body.classList.contains('fullscreen-coding-mode');
        setIsFullscreen(hasClass);
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      });

      // initial check
      setIsFullscreen(document.body.classList.contains('fullscreen-coding-mode'));

      return () => observer.disconnect();
    }, []);
    
  return (
    <div
      className="flex codearena-shell"
      style={{
        height: isFullscreen ? '100vh' : 'calc(100vh - 64px)',
        marginTop: isFullscreen ? 0 : 64,
        overflow: 'auto'
      }}
    >
      {/* ── Collapsible Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className={`${sidebarBg} flex flex-col shrink-0 relative z-20 ${
          isFullscreen ? 'hidden' : ''
        }`}
        style={{ display: isFullscreen ? 'none' : 'flex' }}
      >
        {/* Logo row */}
        <div
          className={`flex items-center border-b overflow-hidden ${
            collapsed ? 'justify-center px-3 py-4' : 'gap-2.5 px-3 py-4'
          } ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isDark ? 'text-gray-500 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronRight size={14} />
            </button>
          ) : (
            <>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shrink-0">
                <Code2 size={13} className="text-white" />
              </div>
              <AnimatePresence>
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.14 }}
                  className={`text-sm font-bold whitespace-nowrap flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  CodeArena
                </motion.span>
              </AnimatePresence>
              <button
                onClick={() => setCollapsed(true)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isDark ? 'text-gray-500 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={13} />
              </button>
            </>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                title={collapsed ? s.label : undefined}
                className={`w-full flex items-center transition-all duration-200 rounded-xl ${
                  collapsed
                    ? 'justify-center py-2'
                    : 'gap-3 px-2.5 py-2.5'
                } ${
                  isActive
                    ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                    : isDark ? 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-300' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {/* Icon with accent dot when active */}
                <div className="relative shrink-0">
                  <div
                    className={`rounded-xl flex items-center justify-center transition-colors ${collapsed ? 'w-10 h-10' : 'w-7 h-7'}`}
                    style={{
                      background: isActive ? `${s.accent}22` : 'transparent',
                      color: isActive ? s.accent : 'inherit',
                    }}
                  >
                    <Icon size={collapsed ? 16 : 14} />
                  </div>
                  {isActive && (
                    <span
                      className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full border-2"
                      style={{
                        background: s.accent,
                        borderColor: isDark ? '#0a0e14' : '#ffffff',
                      }}
                    />
                  )}
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.14 }}
                      className="text-left overflow-hidden"
                    >
                      <div className="text-xs font-semibold whitespace-nowrap leading-tight">
                        {s.label}
                      </div>
                      <div className={`text-[10px] whitespace-nowrap ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {s.sublabel}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Active indicator strip */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`px-3 py-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
            >
              <div
                className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                style={{
                  background: isDark
                    ? `${SECTIONS.find((s) => s.id === active)?.accent}18`
                    : `${SECTIONS.find((s) => s.id === active)?.accent}12`,
                  color: SECTIONS.find((s) => s.id === active)?.accent,
                }}
              >
                {SECTIONS.find((s) => s.id === active)?.label}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ── Main content area ── */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {active === 'arena' && <GeminiCodeArena embedded />}
        {active === 'compiler' && <OnlineCompiler embedded />}
      </div>
    </div>
  );
}
