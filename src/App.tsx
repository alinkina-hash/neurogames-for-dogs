import { Link, Route, Routes } from 'react-router'
import ScrollManager from './components/ScrollManager.tsx'
import CatalogPage from './pages/CatalogPage.tsx'
import GamePage from './pages/GamePage.tsx'

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
      </header>
      <ScrollManager />
      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/games/:id" element={<GamePage />} />
          <Route path="*" element={<p>Страница не найдена.</p>} />
        </Routes>
      </main>
      <footer className="app-footer">
        <p>Это не ветеринарная рекомендация. При проблемах со здоровьем собаки посоветуйтесь с ветеринаром.</p>
      </footer>
    </div>
  )
}

export default App
