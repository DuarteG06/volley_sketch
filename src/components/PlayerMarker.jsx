export default function PlayerMarker({
  marker,
  position,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  return (
    <button
      type="button"
      className="player-marker"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label={`Move ${marker.label || 'blank marker'}`}
    >
      {marker.label}
    </button>
  );
}
