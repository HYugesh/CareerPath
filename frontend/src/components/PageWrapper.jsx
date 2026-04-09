import { useTheme } from '../context/ThemeContext';

export default function PageWrapper({ children }) {
  const { isDark } = useTheme();
  return (
    <div className={isDark ? 'theme-dark' : 'theme-light'}>
      {children}
    </div>
  );
}
