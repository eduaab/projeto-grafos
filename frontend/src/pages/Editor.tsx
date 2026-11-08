import { useMemo, useRef, useState } from 'react'
import { MazeEditorGrid } from '../components/MazeEditorGrid'
import { MazePalette, PALETTE } from '../components/MazePalette'
import { Modal } from '../components/Modal'
import { MazePreviewPane } from '../components/MazePreviewPane'
import { createBlankGrid, downloadTextFile, gridToText, resizeGrid, textToGrid } from '../lib/mazeGridIO'
import { validateGrid } from '../lib/validateMaze'
import { saveToMapasCriados } from '../lib/saveToFolder'
import './Editor.css'

const DEFAULT_ROWS = 11
const DEFAULT_COLS = 17
const MIN_SIZE = 3
const MAX_SIZE = 60

type ModalAction = 'export' | 'save' | 'import' | null

export function Editor() {
  const [grid, setGrid] = useState<string[][]>(() => createBlankGrid(DEFAULT_ROWS, DEFAULT_COLS))
  const [tool, setTool] = useState<string>(PALETTE[0].char)
  const [rowsInput, setRowsInput] = useState(String(DEFAULT_ROWS))
  const [colsInput, setColsInput] = useState(String(DEFAULT_COLS))
  const [filename, setFilename] = useState('meu_labirinto')
  const [importError, setImportError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [pendingImport, setPendingImport] = useState<{ grid: string[][]; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const validation = useMemo(() => validateGrid(grid), [grid])

  const paint = (r: number, c: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => row.slice())
      next[r][c] = tool
      // Only one S allowed — painting a new one moves it instead of adding
      // a second (sync-mapas.mjs would reject a map with two).
      if (tool === 'S') {
        for (let row = 0; row < next.length; row++) {
          for (let col = 0; col < next[row].length; col++) {
            if (!(row === r && col === c) && next[row][col] === 'S') next[row][col] = '.'
          }
        }
      }
      return next
    })
  }

  const applySize = () => {
    const nextRows = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Number(rowsInput) || rows))
    const nextCols = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Number(colsInput) || cols))
    setRowsInput(String(nextRows))
    setColsInput(String(nextCols))
    setGrid((prev) => resizeGrid(prev, nextRows, nextCols))
  }

  const clearGrid = () => {
    setGrid(createBlankGrid(rows, cols))
  }

  const closeModal = () => {
    setModalAction(null)
    setPendingImport(null)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  // Importing previews the file BEFORE touching the real grid — confirming
  // in the modal is what actually replaces your current work.
  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-importing the same filename later
    if (!file) return
    setImportError(null)
    file
      .text()
      .then((text) => {
        setPendingImport({ grid: textToGrid(text), name: file.name.replace(/\.txt$/i, '') })
        setModalAction('import')
      })
      .catch(() => setImportError(`Não consegui ler "${file.name}".`))
  }

  const confirmModal = async () => {
    if (modalAction === 'export') {
      downloadTextFile(filename, gridToText(grid))
      closeModal()
      return
    }

    if (modalAction === 'import' && pendingImport) {
      setGrid(pendingImport.grid)
      setRowsInput(String(pendingImport.grid.length))
      setColsInput(String(pendingImport.grid[0]?.length ?? 0))
      setFilename(pendingImport.name)
      closeModal()
      return
    }

    if (modalAction === 'save') {
      setSaveError(null)
      try {
        await saveToMapasCriados(filename, gridToText(grid))
        setSaveStatus(`Salvo em data/mapas_criados/${filename.endsWith('.txt') ? filename : `${filename}.txt`}`)
        setTimeout(() => setSaveStatus(null), 4000)
      } catch (error) {
        // AbortError: the user closed the folder picker — not a real error.
        if (error instanceof DOMException && error.name === 'AbortError') {
          // no-op
        } else if (error instanceof Error && error.message === 'not-supported') {
          setSaveError('Este navegador não consegue salvar direto na pasta — use "Baixar .txt" e mova o arquivo manualmente.')
        } else {
          setSaveError('Não consegui salvar — veja se a pasta ainda está acessível e tente de novo.')
        }
      }
      closeModal()
    }
  }

  const modalCopy: Record<Exclude<ModalAction, null>, { title: string; confirmLabel: string }> = {
    export: { title: 'Baixar este labirinto?', confirmLabel: 'Baixar .txt' },
    save: { title: 'Salvar este labirinto?', confirmLabel: 'Salvar' },
    import: { title: 'Importar este labirinto?', confirmLabel: 'Confirmar' },
  }

  return (
    <section className="editor">
      <div className="editor-header">
        <span className="context-label">Oficina de Campo</span>
        <h1>Desenhe o seu Labirinto</h1>
        <p className="editor-lede">
          Pinte a grade peça por peça com os mesmos símbolos dos mapas oficiais, depois baixe ou salve o{' '}
          <code>.txt</code> pronto para usar no projeto.
        </p>
      </div>

      <div className="editor-toolbar">
        <div className="editor-size">
          <label>
            Linhas
            {/* type="text" + inputMode="numeric": a native number input's
                spinner arrows are easy to miss-click (confirmed while
                testing this) for a value this narrow — this keeps the
                numeric keyboard on mobile without that stepper UI. */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rowsInput}
              onChange={(event) => setRowsInput(event.target.value.replace(/\D/g, ''))}
            />
          </label>
          <label>
            Colunas
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={colsInput}
              onChange={(event) => setColsInput(event.target.value.replace(/\D/g, ''))}
            />
          </label>
          <button type="button" className="btn" onClick={applySize}>
            Redimensionar
          </button>
        </div>

        <div className="editor-actions">
          <button type="button" className="btn" onClick={clearGrid}>
            Limpar
          </button>
          <button type="button" className="btn" onClick={handleImportClick}>
            Importar .txt
          </button>
          <input ref={fileInputRef} type="file" accept=".txt" className="editor-file-input" onChange={handleImportChange} />
          <input
            type="text"
            className="editor-filename"
            value={filename}
            onChange={(event) => setFilename(event.target.value)}
            aria-label="Nome do arquivo"
          />
          <button type="button" className="btn" onClick={() => setModalAction('save')} title="Salva direto em data/mapas_criados/, sem baixar">
            Salvar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setModalAction('export')}>
            Baixar .txt
          </button>
        </div>
      </div>

      {importError && <p className="editor-error">{importError}</p>}
      {saveError && <p className="editor-error">{saveError}</p>}
      {saveStatus && <p className="editor-status-ok">{saveStatus}</p>}

      <div className="editor-body">
        <MazePalette selected={tool} onSelect={setTool} />

        <div className="editor-grid-wrap">
          <MazeEditorGrid grid={grid} onPaint={paint} />
        </div>

        <div className="editor-status">
          <dl className="editor-stats">
            <div>
              <dt>Tamanho</dt>
              <dd>
                {cols}×{rows}
              </dd>
            </div>
            <div>
              <dt>Chaves</dt>
              <dd>{validation.counts.keys.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt>Portas</dt>
              <dd>{validation.counts.doors.join(', ') || '—'}</dd>
            </div>
          </dl>

          {validation.valid ? (
            <p className="editor-status-ok">Pronto para exportar.</p>
          ) : (
            <ul className="editor-status-issues">
              {validation.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}

          {validation.warnings.length > 0 && (
            <ul className="editor-status-warnings">
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {modalAction && (
        <Modal
          title={modalCopy[modalAction].title}
          confirmLabel={modalCopy[modalAction].confirmLabel}
          onClose={closeModal}
          onConfirm={confirmModal}
        >
          <MazePreviewPane grid={modalAction === 'import' && pendingImport ? pendingImport.grid : grid} />
        </Modal>
      )}
    </section>
  )
}
