import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { ComingSoon } from './pages/ComingSoon'
import { MazeGallery } from './pages/MazeGallery'
import { MazeDetail } from './pages/MazeDetail'
import { Editor } from './pages/Editor'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="labirintos" element={<MazeGallery />} />
        <Route path="labirintos/:id" element={<MazeDetail />} />
        <Route path="editor" element={<Editor />} />
        <Route
          path="importar-exportar"
          element={
            <ComingSoon
              title="Arquivo & Transmissão"
              description="A importação e exportação de labirintos em .txt chega numa próxima parte do frontend."
            />
          }
        />
      </Route>
    </Routes>
  )
}

export default App
