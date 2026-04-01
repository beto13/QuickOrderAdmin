import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/kitchen', label: 'Cocina', icon: '👨‍🍳' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 flex flex-col">
        <div className="px-5 pt-6 pb-8">
          <p className="text-white font-bold text-sm tracking-tight">QuickOrder</p>
          <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">Admin</p>
        </div>

        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Contenido */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
