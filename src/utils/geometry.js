export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clientPointToNormalized(clientX, clientY, bounds) {
  if (!bounds.width || !bounds.height) {
    return { x: 0, y: 0 };
  }

  return {
    x: clamp((clientX - bounds.left) / bounds.width, 0, 1),
    y: clamp((clientY - bounds.top) / bounds.height, 0, 1),
  };
}

export function distanceToSegment(point, segmentStart, segmentEnd) {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }

  const projection =
    ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / (dx * dx + dy * dy);
  const t = clamp(projection, 0, 1);

  const closestPoint = {
    x: segmentStart.x + t * dx,
    y: segmentStart.y + t * dy,
  };

  return Math.hypot(point.x - closestPoint.x, point.y - closestPoint.y);
}
