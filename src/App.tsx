import { Link, Route, Routes, useLocation } from 'react-router'
import { CogStoreProvider } from './cogtest/CogStoreContext.tsx'
import ProfilesPage from './pages/profile/ProfilesPage.tsx'
import ScrollManager from './components/ScrollManager.tsx'
import CatalogPage from './pages/CatalogPage.tsx'
import GamePage from './pages/GamePage.tsx'
import TestRunPage from './pages/profile/TestRunPage.tsx'
import TestResultPage from './pages/profile/TestResultPage.tsx'
import DogProfilePage from './pages/profile/DogProfilePage.tsx'

function ModeSwitch() {
  const { pathname } = useLocation()
  const inProfile = pathname === '/profile' || pathname.startsWith('/profile/')
  return (
    <nav className="mode-switch" aria-label="Разделы">
      <Link to="/" aria-current={inProfile ? undefined : 'page'}>
        Игры
      </Link>
      <Link to="/profile" aria-current={inProfile ? 'page' : undefined}>
        Профиль
      </Link>
    </nav>
  )
}

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="18" fill="currentColor" />
            <g fill="#ffffff">
              <ellipse cx="32" cy="42" rx="13" ry="10" />
              <ellipse cx="14" cy="30" rx="5" ry="7" />
              <ellipse cx="25" cy="19" rx="5" ry="7" />
              <ellipse cx="39" cy="19" rx="5" ry="7" />
              <ellipse cx="50" cy="30" rx="5" ry="7" />
            </g>
          </svg>
          Нейроигры для собак
        </Link>
        <ModeSwitch />
      </header>
      <ScrollManager />
      <main>
        <CogStoreProvider>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/games/:id" element={<GamePage />} />
            <Route path="/profile" element={<ProfilesPage />} />
            <Route
              path="/profile/run/:testId"
              element={<TestRunPage />}
            />
            <Route
              path="/profile/result/:testId"
              element={<TestResultPage />}
            />
            <Route
              path="/profile/dog/:dogId"
              element={<DogProfilePage />}
            />
            <Route path="*" element={<p>Страница не найдена.</p>} />
          </Routes>
        </CogStoreProvider>
      </main>
      <footer className="app-footer">
        <p>
          Это не ветеринарная рекомендация. При проблемах со здоровьем собаки
          посоветуйтесь с ветеринаром.
        </p>
      </footer>
    </div>
  )
}

export default App
