import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COURT_DIMENSIONS, TOOLS } from '../constants';
import { clientPointToNormalized, distanceToSegment } from '../utils/geometry';
import CourtSvg from './CourtSvg';
import MarkerSidebar from './MarkerSidebar';
import PlayerMarker from './PlayerMarker';

function drawStroke(context, stroke, width, height) {
  if (!stroke.points.length) {
    return;
  }

  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = stroke.lineWidth;
  context.globalAlpha = stroke.opacity ?? 1;
  context.globalCompositeOperation = stroke.tool === TOOLS.ERASER ? 'destination-out' : 'source-over';
  context.strokeStyle = stroke.tool === TOOLS.ERASER ? 'rgba(0,0,0,1)' : stroke.color;

  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    context.beginPath();
    context.arc(point.x * width, point.y * height, stroke.lineWidth / 2, 0, Math.PI * 2);
    context.fillStyle = stroke.tool === TOOLS.ERASER ? 'rgba(0,0,0,1)' : stroke.color;
    context.fill();
  } else {
    context.beginPath();

    stroke.points.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;

      if (index === 0) {
        context.moveTo(x, y);
        return;
      }

      context.lineTo(x, y);
    });

    context.stroke();
  }

  context.restore();
}

export default function CourtBoard({
  courtMode,
  placedMarkers,
  drawingStrokes,
  toolSettings,
  isMarkerSidebarOpen,
  onMarkerAdd,
  onMarkerMove,
  onMarkerRemove,
  onMarkersClear,
  onLoadStartingLineup,
  onLoadStartingTwelve,
  onDrawingStrokeCommit,
  onDrawingStrokeRemove,
  onToggleMarkerSidebar,
}) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingStrokeRef = useRef(null);
  const pointerTrailRef = useRef(null);
  const pointerTrailTimeoutRef = useRef(null);
  const lineEraseActiveRef = useRef(false);
  const draggingMarkerIdRef = useRef(null);
  const markerGrabOffsetRef = useRef({ x: 0, y: 0 });
  const paletteDragRef = useRef(null);
  const contextRef = useRef(null);
  const pixelRatioRef = useRef(1);
  const [stageBounds, setStageBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [dragPreview, setDragPreview] = useState(null);
  const aspectRatio = COURT_DIMENSIONS[courtMode].aspectRatio;
  const isFreehandTool =
    toolSettings.activeTool === TOOLS.PEN || toolSettings.activeTool === TOOLS.ERASER;
  const isDrawingTool = isFreehandTool || toolSettings.activeTool === TOOLS.LINE_ERASER;
  const isPointerTool = toolSettings.activeTool === TOOLS.POINTER;

  function redrawCanvas(extraStroke = null) {
    const context = contextRef.current;

    if (!context || !stageBounds.width || !stageBounds.height) {
      return;
    }

    context.setTransform(pixelRatioRef.current, 0, 0, pixelRatioRef.current, 0, 0);
    context.clearRect(0, 0, stageBounds.width, stageBounds.height);

    drawingStrokes.forEach((stroke) => {
      drawStroke(context, stroke, stageBounds.width, stageBounds.height);
    });

    if (extraStroke) {
      drawStroke(context, extraStroke, stageBounds.width, stageBounds.height);
    }
  }

  function clearPointerTrail() {
    pointerTrailRef.current = null;
    redrawCanvas(drawingStrokeRef.current);
  }

  function schedulePointerTrailClear() {
    window.clearTimeout(pointerTrailTimeoutRef.current);
    pointerTrailTimeoutRef.current = window.setTimeout(clearPointerTrail, 650);
  }

  function isPointInsideStage(clientX, clientY) {
    return (
      clientX >= stageBounds.left &&
      clientX <= stageBounds.left + stageBounds.width &&
      clientY >= stageBounds.top &&
      clientY <= stageBounds.top + stageBounds.height
    );
  }

  function getMarkerPositionFromPointer(clientX, clientY) {
    return clientPointToNormalized(
      clientX - markerGrabOffsetRef.current.x,
      clientY - markerGrabOffsetRef.current.y,
      stageBounds,
    );
  }

  function findStrokeAtPoint(point) {
    const pointInPixels = {
      x: point.x * stageBounds.width,
      y: point.y * stageBounds.height,
    };

    for (let index = drawingStrokes.length - 1; index >= 0; index -= 1) {
      const stroke = drawingStrokes[index];
      const hitRadius = Math.max(stroke.lineWidth / 2, toolSettings.lineWidth / 2) + 8;

      if (!stroke.points.length) {
        continue;
      }

      if (stroke.points.length === 1) {
        const onlyPoint = {
          x: stroke.points[0].x * stageBounds.width,
          y: stroke.points[0].y * stageBounds.height,
        };

        if (Math.hypot(pointInPixels.x - onlyPoint.x, pointInPixels.y - onlyPoint.y) <= hitRadius) {
          return stroke;
        }

        continue;
      }

      for (let segmentIndex = 1; segmentIndex < stroke.points.length; segmentIndex += 1) {
        const start = stroke.points[segmentIndex - 1];
        const end = stroke.points[segmentIndex];
        const distance = distanceToSegment(
          pointInPixels,
          { x: start.x * stageBounds.width, y: start.y * stageBounds.height },
          { x: end.x * stageBounds.width, y: end.y * stageBounds.height },
        );

        if (distance <= hitRadius) {
          return stroke;
        }
      }
    }

    return null;
  }

  function eraseStrokeAtPointer(pointerEvent) {
    const point = clientPointToNormalized(pointerEvent.clientX, pointerEvent.clientY, stageBounds);
    const hitStroke = findStrokeAtPoint(point);

    if (hitStroke) {
      onDrawingStrokeRemove(hitStroke.id);
    }
  }

  useLayoutEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return undefined;
    }

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      setStageBounds({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    measure();

    // The stage can change size across phones, tablets, and desktop layouts.
    // We observe it so the canvas redraws from normalized stroke data cleanly.
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(stage);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [courtMode]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !stageBounds.width || !stageBounds.height) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(stageBounds.width * pixelRatio);
    canvas.height = Math.round(stageBounds.height * pixelRatio);
    canvas.style.width = `${stageBounds.width}px`;
    canvas.style.height = `${stageBounds.height}px`;

    pixelRatioRef.current = pixelRatio;
    contextRef.current = canvas.getContext('2d');
    redrawCanvas(drawingStrokeRef.current);
  }, [stageBounds]);

  useEffect(() => {
    redrawCanvas(drawingStrokeRef.current ?? pointerTrailRef.current);
  }, [drawingStrokes, stageBounds.width, stageBounds.height]);

  useEffect(
    () => () => {
      window.clearTimeout(pointerTrailTimeoutRef.current);
    },
    [],
  );

  function startDrawing(pointerEvent) {
    if (draggingMarkerIdRef.current || paletteDragRef.current || pointerEvent.button === 2) {
      return;
    }

    if (isPointerTool) {
      window.clearTimeout(pointerTrailTimeoutRef.current);
      pointerEvent.preventDefault();
      const point = clientPointToNormalized(pointerEvent.clientX, pointerEvent.clientY, stageBounds);

      pointerTrailRef.current = {
        id: `pointer-trail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tool: TOOLS.PEN,
        color: toolSettings.penColor,
        lineWidth: Math.max(toolSettings.lineWidth, 4),
        opacity: 0.65,
        points: [point],
      };

      redrawCanvas(pointerTrailRef.current);
      pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
      return;
    }

    if (!isDrawingTool) {
      return;
    }

    pointerEvent.preventDefault();

    if (toolSettings.activeTool === TOOLS.LINE_ERASER) {
      lineEraseActiveRef.current = true;
      eraseStrokeAtPointer(pointerEvent);
      pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
      return;
    }

    const point = clientPointToNormalized(pointerEvent.clientX, pointerEvent.clientY, stageBounds);

    const stroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tool: toolSettings.activeTool,
      color: toolSettings.penColor,
      lineWidth: toolSettings.lineWidth,
      points: [point],
    };

    drawingStrokeRef.current = stroke;
    redrawCanvas(stroke);
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  }

  function updateDrawing(pointerEvent) {
    if (isPointerTool) {
      if (!pointerTrailRef.current) {
        return;
      }

      pointerEvent.preventDefault();
      const point = clientPointToNormalized(pointerEvent.clientX, pointerEvent.clientY, stageBounds);
      pointerTrailRef.current = {
        ...pointerTrailRef.current,
        points: [...pointerTrailRef.current.points, point],
      };

      redrawCanvas(pointerTrailRef.current);
      return;
    }

    if (toolSettings.activeTool === TOOLS.LINE_ERASER) {
      if (!lineEraseActiveRef.current) {
        return;
      }

      pointerEvent.preventDefault();
      eraseStrokeAtPointer(pointerEvent);
      return;
    }

    if (!drawingStrokeRef.current) {
      return;
    }

    pointerEvent.preventDefault();
    const point = clientPointToNormalized(pointerEvent.clientX, pointerEvent.clientY, stageBounds);
    drawingStrokeRef.current = {
      ...drawingStrokeRef.current,
      points: [...drawingStrokeRef.current.points, point],
    };

    redrawCanvas(drawingStrokeRef.current);
  }

  function endDrawing(pointerEvent) {
    if (isPointerTool) {
      if (!pointerTrailRef.current) {
        return;
      }

      pointerEvent.preventDefault();
      schedulePointerTrailClear();

      if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
        pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
      }

      return;
    }

    if (toolSettings.activeTool === TOOLS.LINE_ERASER) {
      lineEraseActiveRef.current = false;

      if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
        pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
      }

      return;
    }

    if (!drawingStrokeRef.current) {
      return;
    }

    pointerEvent.preventDefault();
    onDrawingStrokeCommit(drawingStrokeRef.current);
    drawingStrokeRef.current = null;

    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
  }

  function startMarkerDrag(marker, pointerEvent) {
    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    draggingMarkerIdRef.current = marker.id;
    markerGrabOffsetRef.current = {
      x: pointerEvent.clientX - (stageBounds.left + marker.x * stageBounds.width),
      y: pointerEvent.clientY - (stageBounds.top + marker.y * stageBounds.height),
    };
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  }

  function moveMarker(markerId, pointerEvent) {
    if (draggingMarkerIdRef.current !== markerId) {
      return;
    }

    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    onMarkerMove(markerId, getMarkerPositionFromPointer(pointerEvent.clientX, pointerEvent.clientY));
  }

  function endMarkerDrag(markerId, pointerEvent) {
    if (draggingMarkerIdRef.current !== markerId) {
      return;
    }

    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();

    const nextPosition = getMarkerPositionFromPointer(pointerEvent.clientX, pointerEvent.clientY);
    const markerClientX = stageBounds.left + nextPosition.x * stageBounds.width;
    const markerClientY = stageBounds.top + nextPosition.y * stageBounds.height;

    if (isPointInsideStage(markerClientX, markerClientY)) {
      onMarkerMove(markerId, nextPosition);
    } else {
      onMarkerRemove(markerId);
    }

    draggingMarkerIdRef.current = null;
    markerGrabOffsetRef.current = { x: 0, y: 0 };

    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
  }

  function startPaletteDrag(player, pointerEvent) {
    pointerEvent.preventDefault();
    paletteDragRef.current = { playerId: player.id, label: player.label };
    setDragPreview({
      label: player.label,
      x: pointerEvent.clientX,
      y: pointerEvent.clientY,
    });
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  }

  function movePaletteDrag(_player, pointerEvent) {
    if (!paletteDragRef.current) {
      return;
    }

    pointerEvent.preventDefault();
    setDragPreview((currentPreview) =>
      currentPreview
        ? {
            ...currentPreview,
            x: pointerEvent.clientX,
            y: pointerEvent.clientY,
          }
        : currentPreview,
    );
  }

  function endPaletteDrag(_player, pointerEvent) {
    if (!paletteDragRef.current) {
      return;
    }

    pointerEvent.preventDefault();

    if (isPointInsideStage(pointerEvent.clientX, pointerEvent.clientY)) {
      onMarkerAdd(
        paletteDragRef.current.playerId,
        clientPointToNormalized(pointerEvent.clientX, pointerEvent.clientY, stageBounds),
      );
    }

    paletteDragRef.current = null;
    setDragPreview(null);

    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
  }

  return (
    <section className="board-shell">
      <div className="board-intro">
        <p>
          Draw on the court, drag markers in from the sidebar, and drag any placed marker out of
          bounds to delete it.
        </p>
        <button type="button" className="sidebar-toggle" onClick={onToggleMarkerSidebar}>
          {isMarkerSidebarOpen ? 'Hide marker bank' : 'Show marker bank'}
        </button>
      </div>

      <div
        className={`board-layout ${isMarkerSidebarOpen ? '' : 'board-layout--sidebar-hidden'}`.trim()}
      >
        <div className="court-panel">
          <div className="court-stage" ref={stageRef} style={{ aspectRatio }}>
            <CourtSvg courtMode={courtMode} />

            <canvas
              ref={canvasRef}
              className={`drawing-layer ${
                isDrawingTool || isPointerTool ? 'drawing-layer--active' : ''
              }`.trim()}
              onPointerDown={startDrawing}
              onPointerMove={updateDrawing}
              onPointerUp={endDrawing}
              onPointerCancel={endDrawing}
            />

            <div className="markers-layer" aria-label="Player positions">
              {placedMarkers.map((marker) => (
                <PlayerMarker
                  key={marker.id}
                  marker={marker}
                  position={marker}
                  onPointerDown={(event) => startMarkerDrag(marker, event)}
                  onPointerMove={(event) => moveMarker(marker.id, event)}
                  onPointerUp={(event) => endMarkerDrag(marker.id, event)}
                  onPointerCancel={(event) => endMarkerDrag(marker.id, event)}
                />
              ))}
            </div>
          </div>
        </div>

        {isMarkerSidebarOpen ? (
          <MarkerSidebar
            courtMode={courtMode}
            placedMarkers={placedMarkers}
            onPalettePointerDown={startPaletteDrag}
            onPalettePointerMove={movePaletteDrag}
            onPalettePointerUp={endPaletteDrag}
            onPalettePointerCancel={endPaletteDrag}
            onQuickAdd={onMarkerAdd}
            onLoadStartingLineup={onLoadStartingLineup}
            onLoadStartingTwelve={onLoadStartingTwelve}
            onClearMarkers={onMarkersClear}
            onRemoveMarker={onMarkerRemove}
          />
        ) : null}
      </div>

      {dragPreview && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="drag-preview"
              style={{
                left: `${dragPreview.x}px`,
                top: `${dragPreview.y}px`,
              }}
              aria-hidden="true"
            >
              {dragPreview.label}
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
