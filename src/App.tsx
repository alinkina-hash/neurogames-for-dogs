import { Link, Route, Routes } from 'react-router'
import CatalogPage from './pages/CatalogPage.tsx'
import GamePage from './pages/GamePage.tsx'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/">Нейроигры для собак</Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/games/:id" element={<GamePage />} />
          <Route path="*" element={<p>Страница не найдена.</p>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
