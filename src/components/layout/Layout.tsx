import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC] dark:bg-base-300 transition-colors duration-200">
      <Navbar />
      <main className="flex-1 overflow-auto flex flex-col relative pt-6">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-10">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
