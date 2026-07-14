import { NavLink, Outlet } from 'react-router-dom'
import { useWorkstream } from '../hooks/useWorkstream'

const NAV_ITEMS = [
  { to: '/', label: 'Generate', end: true },
  { to: '/context', label: 'Context' },
  { to: '/coverage', label: 'Coverage' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
]

function navClass({ isActive }) {
  return [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  ].join(' ')
}

export default function Layout() {
  const { workstreams, activeWorkstream, activeWorkstreamId, setActiveWorkstream } =
    useWorkstream()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <span className="text-lg font-semibold text-gray-900 shrink-0">StoryPilot</span>
              <nav className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="workstream-switcher" className="sr-only">
                Active workstream
              </label>
              <select
                id="workstream-switcher"
                value={activeWorkstreamId ?? ''}
                onChange={(e) => setActiveWorkstream(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {workstreams.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
              {activeWorkstream && (
                <span
                  className="hidden md:inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: activeWorkstream.color }}
                  title={activeWorkstream.name}
                />
              )}
            </div>
          </div>

          <nav className="flex sm:hidden gap-1 pb-3 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
