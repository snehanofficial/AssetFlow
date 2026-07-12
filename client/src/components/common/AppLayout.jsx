import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import GlobalHeader from './GlobalHeader.jsx';

export const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main viewport canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global header banner */}
        <GlobalHeader />

        {/* Scrollable workspace output */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
