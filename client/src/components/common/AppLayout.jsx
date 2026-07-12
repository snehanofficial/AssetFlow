import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import GlobalHeader from './GlobalHeader.jsx';

export const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Global Header */}
        <GlobalHeader />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto" id="main-content" tabIndex={-1}>
          <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
