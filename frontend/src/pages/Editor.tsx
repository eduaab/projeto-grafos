import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MazeEditorGrid } from '../components/MazeEditorGrid'
import { MazePalette } from '../components/MazePalette'
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
type Dimension = 'rows' | 'cols'

type EditorDraft = {
  grid: string[][]
  tool: string
  rowsInput: string
  colsInput: string
  filename: string
}

const DIMENSIONS = [
  { key: 'rows', label: 'Linhas' },
  { key: 'cols', label: 'Colunas' },
] as const

function dimensionError(value: string, label: string) {
  if (!value) return null
  if (!/^-?\d+$/.test(value)) return 'Digite um número inteiro.'
  const count = Number(value)
  const subject = `O número de ${label.toLowerCase()}`
  if (count < MIN_SIZE) return `${subject} não pode ser menor que ${MIN_SIZE}.`
  if (count > MAX_SIZE) return `${subject} não pode ser maior que ${MAX_SIZE}.`
  return null
}

export function Editor() {
  const { hash, state } = useLocation()
  const [source] = useState<{ grid: string[][]; filename: string } | undefined>(() => state?.editorMap)
  const [draft] = useState<EditorDraft | undefined>(() => window.history.state?.editorDraft)
  const [grid, setGrid] = useState(() => draft?.grid ?? source?.grid ?? createBlankGrid(DEFAULT_ROWS, DEFAULT_COLS))
  const [tool, setTool] = useState(draft?.tool ?? '.')
  const [rowsInput, setRowsInput] = useState(draft?.rowsInput ?? String(source?.grid.length ?? DEFAULT_ROWS))
  const [colsInput, setColsInput] = useState(draft?.colsInput ?? String(source?.grid[0]?.length ?? DEFAULT_COLS))
  const [filename, setFilename] = useState(draft?.filename ?? source?.filename ?? 'meu_labirinto.txt')
  const [downloadName, setDownloadName] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [pendingImport, setPendingImport] = useState<{ grid: string[][]; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileSectionRef = useRef<HTMLElement>(null)
  const resizeSource = useRef<string[][] | null>(null)

  useEffect(() => {
    if (hash === '#arquivo') fileSectionRef.current?.scrollIntoView()
  }, [hash])

  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const downloadStem = downloadName.trim().replace(/\.txt$/i, '').trim()
  const validation = useMemo(() => validateGrid(grid), [grid])
  const simulatorUrl = '/labirinto_interativo.html' + (validation.valid
    ? '#' + new URLSearchParams({ grade: gridToText(grid), nome: filename })
    : '')

  const rememberDraft = () => {
    const editorDraft: EditorDraft = { grid, tool, rowsInput, colsInput, filename }
    window.history.replaceState({ ...window.history.state, editorDraft }, '')
  }

  const paint = (r: number, c: number) => {
    resizeSource.current = null
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

  const changeDimension = (dimension: Dimension, label: string, value: string) => {
    const setValue = dimension === 'rows' ? setRowsInput : setColsInput
    setValue(value)

    // Keep the original cells while typing, so an intermediate digit cannot crop them.
    const source = resizeSource.current ?? grid
    resizeSource.current = source
    const sourceRows = source.length
    const sourceCols = source[0]?.length ?? 0

    if (!value) return
    if (dimensionError(value, label)) {
      setGrid(source)
      return
    }

    const nextRows = dimension === 'rows' ? Number(value) : sourceRows
    const nextCols = dimension === 'cols' ? Number(value) : sourceCols
    setGrid(nextRows === sourceRows && nextCols === sourceCols ? source : resizeGrid(source, nextRows, nextCols))
  }

  const finishDimension = (dimension: Dimension, value: string) => {
    resizeSource.current = null
    if (value) return
    if (dimension === 'rows') setRowsInput(String(rows))
    else setColsInput(String(cols))
  }

  const clearGrid = () => {
    setGrid(createBlankGrid(rows, cols))
  }

  const replaceGrid = (next: string[][]) => {
    resizeSource.current = null
    setGrid(next)
    setRowsInput(String(next.length))
    setColsInput(String(next[0]?.length ?? 0))
  }

  const closeModal = () => {
    setModalAction(null)
    setPendingImport(null)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const openDownload = () => {
    setDownloadName(filename)
    setModalAction('export')
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
      const nextName = downloadStem + '.txt'
      downloadTextFile(nextName, gridToText(grid))
      setFilename(nextName)
      setSaveStatus('Arquivo baixado.')
      closeModal()
      return
    }

    if (modalAction === 'import' && pendingImport) {
      replaceGrid(pendingImport.grid)
      setFilename(pendingImport.name + '.txt')
      setSaveStatus('Mapa importado.')
      closeModal()
      return
    }

    if (modalAction === 'save') {
      setSaveStatus(null)
      setSaveError(null)
      try {
        await saveToMapasCriados(filename, gridToText(grid))
        setSaveStatus(`Salvo em data/mapas_criados/${filename.endsWith('.txt') ? filename : `${filename}.txt`}`)
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
    export: { title: 'Baixar labirinto', confirmLabel: 'Baixar .txt' },
    save: { title: 'Salvar labirinto', confirmLabel: 'Salvar labirinto' },
    import: { title: 'Importar labirinto', confirmLabel: 'Importar labirinto' },
  }

  return (
    <section className="editor">
      <h1 className="visually-hidden">Editor</h1>
      <div className="editor-body">
        <div className="editor-grid-wrap">
          <MazeEditorGrid grid={grid} onPaint={paint} />
        </div>

        <aside className="editor-sidebar">
          <MazePalette selected={tool} onSelect={setTool} />
          <div className={'notice' + (validation.valid ? '' : ' notice-error')} aria-live="polite">
            <strong>{validation.valid ? 'Mapa válido' : 'Mapa inválido'}</strong>
            <p>{validation.counts.starts} início(s) · {validation.counts.goals} saída(s)</p>
            {(validation.counts.keys.length > 0 || validation.counts.doors.length > 0) && (
              <p>Chaves {validation.counts.keys.join(', ') || '—'} · Portas {validation.counts.doors.join(', ') || '—'}</p>
            )}
            {validation.issues.length > 0 && (
              <ul>{validation.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
            )}
          </div>
          {validation.warnings.length > 0 && (
            <div className="notice notice-warning">
              <ul>{validation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </div>
          )}

          <section className="editor-toolbar" aria-labelledby="editor-size-title">
            <h2 id="editor-size-title">Dimensões da grade</h2>
            <div className="editor-size-fields">
              {DIMENSIONS.map(({ key, label }) => {
                const value = key === 'rows' ? rowsInput : colsInput
                const error = dimensionError(value, label)
                const errorId = `editor-${key}-error`
                return (
                  <label key={key}>
                    {label}
                    <input
                      className="field"
                      type="number"
                      min={MIN_SIZE}
                      max={MAX_SIZE}
                      inputMode="numeric"
                      value={value}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? errorId : undefined}
                      onChange={(event) => changeDimension(key, label, event.target.value)}
                      onBlur={() => finishDimension(key, value)}
                    />
                  </label>
                )
              })}
              <button className="btn" type="button" onClick={clearGrid}>Limpar</button>
            </div>
            {DIMENSIONS.map(({ key, label }) => {
              const error = dimensionError(key === 'rows' ? rowsInput : colsInput, label)
              return error && <p className="editor-size-error" key={key} id={`editor-${key}-error`} role="alert">{error}</p>
            })}
            {source && (
              <button className="btn editor-restore" type="button" onClick={() => {
                replaceGrid(source.grid)
                setFilename(source.filename)
              }}>
                Restaurar cópia
              </button>
            )}
          </section>

          <section className="editor-file" id="arquivo" ref={fileSectionRef}>
            <h2>Arquivo do labirinto</h2>
            {importError && <p className="notice notice-error" role="alert">{importError}</p>}
            {saveError && <p className="notice notice-error" role="alert">{saveError}</p>}
            {saveStatus && <p className="notice" role="status">{saveStatus}</p>}
            <input ref={fileInputRef} type="file" accept=".txt" hidden onChange={handleImportChange} />
            <div className="editor-file-actions">
              <button className="btn" type="button" onClick={handleImportClick}>Importar .txt</button>
              <a className="btn" href={simulatorUrl} onClick={rememberDraft}>Abrir simulador</a>
              <button className="btn" type="button" onClick={openDownload}>Baixar .txt</button>
              <button className="btn btn-primary" type="button" onClick={() => setModalAction('save')}>Salvar</button>
            </div>
          </section>
        </aside>
      </div>

      {modalAction && (
        <Modal
          title={modalCopy[modalAction].title}
          confirmLabel={modalCopy[modalAction].confirmLabel}
          confirmDisabled={modalAction === 'export' && !downloadStem}
          onClose={closeModal}
          onConfirm={confirmModal}
        >
          {modalAction === 'export' ? (
            <label className="editor-download-name">
              Nome do arquivo
              <input className="field" type="text" value={downloadName} onChange={(event) => setDownloadName(event.target.value)} />
            </label>
          ) : (
            <p className="editor-preview-name">{modalAction === 'import' && pendingImport ? pendingImport.name + '.txt' : filename}</p>
          )}
          <MazePreviewPane grid={modalAction === 'import' && pendingImport ? pendingImport.grid : grid} />
        </Modal>
      )}
    </section>
  )
}
