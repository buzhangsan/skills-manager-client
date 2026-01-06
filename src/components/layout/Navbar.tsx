import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, Library, ShoppingBag, ShieldCheck, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

function Navbar() {
    const location = useLocation();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Initialize theme from system preference or local storage if implemented
    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const navItems = [
        { path: '/', label: '仪表盘', icon: LayoutDashboard },
        { path: '/my-skills', label: '我的 Skills', icon: Library },
        { path: '/marketplace', label: '市场', icon: ShoppingBag },
        { path: '/security', label: '安全', icon: ShieldCheck },
        { path: '/settings', label: '设置', icon: Settings },
    ];

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    return (
        <nav
            style={{ position: 'sticky', top: 0, zIndex: 50 }}
            className="pt-4 transition-all duration-200 bg-[#FAFBFC] dark:bg-base-300 border-b border-transparent"
        >
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative" style={{ zIndex: 10 }}>
                <div className="flex items-center justify-between h-16">
                    {/* Logo - Left */}
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-base-content flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                S
                            </div>
                            <span>Skill Manager</span>
                        </Link>
                    </div>

                    {/* Pill Navigation - Center (Hidden on small screens) */}
                    <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-base-200 rounded-full p-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 lg:px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isActive(item.path)
                                    ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-base-content dark:hover:bg-base-100'
                                    }`}
                            >
                                <item.icon size={16} />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-base-200 hover:bg-gray-200 dark:hover:bg-base-100 flex items-center justify-center transition-colors"
                            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile Navigation (Simple fallback) */}
            <div className="md:hidden flex overflow-x-auto p-2 gap-2 border-t border-base-200 hide-scrollbar">
                 {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex-none px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${isActive(item.path)
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                            : 'bg-gray-100 text-gray-700 dark:bg-base-200 dark:text-gray-400'
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}

export default Navbar;
