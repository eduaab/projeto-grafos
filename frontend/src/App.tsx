import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { MazeGallery } from './pages/MazeGallery'
import { MazeDetail } from './pages/MazeDetail'
import { Editor } from './pages/Editor'
import { Graficos } from './pages/Graficos'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="labirintos" element={<MazeGallery />} />
        <Route path="labirintos/:id" element={<MazeDetail />} />
        <Route path="editor" element={<Editor />} />
        <Route path="graficos" element={<Graficos />} />
        <Route path="importar-exportar" element={<Navigate to="/editor#arquivo" replace />} />
      </Route>
    </Routes>
  )
}

export default App
