import { createRootRoute, Outlet, Link, useRouterState } from '@tanstack/react-router';
import { Home, Users, MessageSquare, Settings, GraduationCap } from 'lucide-react';

export const Route = createRootRoute({
  component: TeacherLayout,
});

function TeacherLayout() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const navItems = [
    { to: '/', label: '대시보드', icon: Home },
    { to: '/students', label: '학생 관리', icon: Users },
    { to: '/messages', label: '쪽지', icon: MessageSquare },
    { to: '/settings', label: '설정', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">선생님</h1>
              <p className="text-xs text-gray-500">GB Planner</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium ${
                  isActive ? 'text-emerald-600' : 'text-gray-500'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}
