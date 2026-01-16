import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Library, ShoppingBag, ShieldCheck, Settings, Box } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-skills', icon: Library, label: 'My Skills' },
    { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { to: '/security', icon: ShieldCheck, label: 'Security' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-base-200 min-h-screen flex flex-col border-r border-base-300">
      <div className="p-4 flex items-center gap-2 border-b border-base-300">
        <div className="bg-primary p-2 rounded-lg text-primary-content">
          <Box size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg">Skill Manager</h1>
          <p className="text-xs text-base-content/60">v1.0.0</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-content shadow-md'
                  : 'hover:bg-base-300 text-base-content'
              )
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-base-300">
        <div className="bg-base-100 p-4 rounded-xl border border-base-300 shadow-sm">
           <p className="text-xs font-medium text-base-content/70 mb-2">Storage Used</p>
           <progress className="progress progress-primary w-full" value="40" max="100"></progress>
           <p className="text-xs text-right mt-1 text-base-content/50">2.4 GB / 6 GB</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
