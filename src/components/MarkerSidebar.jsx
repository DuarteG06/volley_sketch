import { COURT_MODES, PLAYER_DEFINITIONS } from '../constants';

function buildPlacedMarkerRows(placedMarkers) {
  const labelCounts = {};

  return [...placedMarkers]
    .sort(
      (left, right) =>
        (left.label || 'Blank').localeCompare(right.label || 'Blank') || left.id.localeCompare(right.id),
    )
    .map((marker) => {
      labelCounts[marker.playerId] = (labelCounts[marker.playerId] ?? 0) + 1;

      return {
        ...marker,
        displayLabel: `${marker.label || 'Blank'} ${labelCounts[marker.playerId]}`,
      };
    });
}

export default function MarkerSidebar({
  courtMode,
  placedMarkers,
  onPalettePointerDown,
  onPalettePointerMove,
  onPalettePointerUp,
  onPalettePointerCancel,
  onQuickAdd,
  onLoadStartingLineup,
  onLoadStartingTwelve,
  onClearMarkers,
  onRemoveMarker,
}) {
  const placedMarkerRows = buildPlacedMarkerRows(placedMarkers);
  const canLoadStartingTwelve = courtMode === COURT_MODES.FULL;

  return (
    <aside className="marker-sidebar">
      <section className="marker-sidebar__section">
        <div className="marker-sidebar__heading">
          <p className="control-group__label">Marker bank</p>
          <p>Drag a role onto the court or tap add for a quick drop in the middle.</p>
        </div>

        <div className="marker-bank">
          {PLAYER_DEFINITIONS.map((player) => (
            <div className="marker-bank__row" key={player.id}>
              <button
                type="button"
                className="marker-bank__chip"
                onPointerDown={(event) => onPalettePointerDown(player, event)}
                onPointerMove={(event) => onPalettePointerMove(player, event)}
                onPointerUp={(event) => onPalettePointerUp(player, event)}
                onPointerCancel={(event) => onPalettePointerCancel(player, event)}
              >
                {player.bankLabel || player.label || 'Blank'}
              </button>

              <button type="button" className="marker-bank__add" onClick={() => onQuickAdd(player.id)}>
                Add
              </button>
            </div>
          ))}
        </div>

        <div className="marker-sidebar__actions">
          <button type="button" className="sidebar-action" onClick={onLoadStartingLineup}>
            Load starting six
          </button>
          <button
            type="button"
            className="sidebar-action"
            onClick={onLoadStartingTwelve}
            disabled={!canLoadStartingTwelve}
            title={canLoadStartingTwelve ? 'Load both sides' : 'Available in full-court mode only'}
          >
            Load starting 12
          </button>
          <button
            type="button"
            className="sidebar-action sidebar-action--muted"
            onClick={onClearMarkers}
            disabled={!placedMarkers.length}
          >
            Clear markers
          </button>
        </div>
      </section>

      <section className="marker-sidebar__section">
        <div className="marker-sidebar__heading">
          <p className="control-group__label">On court</p>
          <p>{placedMarkers.length ? 'Remove any marker from here.' : 'No markers placed yet.'}</p>
        </div>

        <ul className="placed-marker-list">
          {placedMarkerRows.map((marker) => (
            <li key={marker.id} className="placed-marker-list__item">
              <span className="placed-marker-list__label">{marker.displayLabel}</span>
              <button type="button" className="placed-marker-list__remove" onClick={() => onRemoveMarker(marker.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
