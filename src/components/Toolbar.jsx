import { COURT_MODES } from '../constants';

const THICKNESS_OPTIONS = [2, 4, 6, 8, 10];
const COLOR_OPTIONS = ['#124559', '#0b6e4f', '#b33f62', '#f28f3b', '#22223b'];

export default function Toolbar({
  courtMode,
  toolSettings,
  themeMode,
  onModeChange,
  onToolChange,
  onLineWidthChange,
  onColorChange,
  onClearDrawing,
  onThemeToggle,
  onReset,
}) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <p className="eyebrow">Volleyball Sketch Board</p>
        <h1>Volley Sketch</h1>
      </div>

      <div className="toolbar__panel">
        <section className="control-group">
          <span className="control-group__label">Court</span>
          <div className="segmented-control" role="group" aria-label="Court mode">
            <button
              type="button"
              className={courtMode === COURT_MODES.FULL ? 'is-active' : ''}
              onClick={() => onModeChange(COURT_MODES.FULL)}
            >
              Full court
            </button>
            <button
              type="button"
              className={courtMode === COURT_MODES.HALF ? 'is-active' : ''}
              onClick={() => onModeChange(COURT_MODES.HALF)}
            >
              Half court
            </button>
          </div>
        </section>

        <section className="control-group">
          <span className="control-group__label">Tools</span>
          <div className="segmented-control" role="group" aria-label="Drawing tools">
            <button
              type="button"
              className={toolSettings.activeTool === 'pen' ? 'is-active' : ''}
              onClick={() => onToolChange('pen')}
            >
              Pen
            </button>
            <button
              type="button"
              className={toolSettings.activeTool === 'eraser' ? 'is-active' : ''}
              onClick={() => onToolChange('eraser')}
            >
              Eraser
            </button>
            <button
              type="button"
              className={toolSettings.activeTool === 'line-eraser' ? 'is-active' : ''}
              onClick={() => onToolChange('line-eraser')}
            >
              Line eraser
            </button>
            <button type="button" className="is-danger" onClick={onClearDrawing}>
              Clear drawing
            </button>
          </div>
        </section>

        <section className="control-group control-group--thickness">
          <label className="range-control" htmlFor="line-width">
            <span className="control-group__label">Thickness</span>
            <input
              id="line-width"
              type="range"
              min="2"
              max="10"
              step="2"
              list="line-width-presets"
              value={toolSettings.lineWidth}
              onChange={(event) => onLineWidthChange(Number(event.target.value))}
            />
            <datalist id="line-width-presets">
              {THICKNESS_OPTIONS.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
            <span className="range-control__value">{toolSettings.lineWidth}px</span>
          </label>
        </section>

        <section className="control-group control-group--color">
          <span className="control-group__label">Color</span>
          <div className="color-palette" role="group" aria-label="Pen color">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use ${color} pen color`}
                className={toolSettings.penColor === color ? 'is-active' : ''}
                style={{ '--swatch': color }}
                onClick={() => onColorChange(color)}
                disabled={toolSettings.activeTool !== 'pen'}
              />
            ))}
          </div>
        </section>

        <section className="control-group control-group--theme">
          <span className="control-group__label">Theme</span>
          <button type="button" className="theme-toggle" onClick={onThemeToggle}>
            {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </section>

        <button type="button" className="reset-button" onClick={onReset}>
          Reset board
        </button>
      </div>
    </header>
  );
}
