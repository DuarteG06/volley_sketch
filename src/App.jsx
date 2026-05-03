import { useEffect, useMemo, useState } from 'react';
import CourtBoard from './components/CourtBoard';
import Toolbar from './components/Toolbar';
import { COURT_MODES, DEFAULT_APP_STATE, PLAYER_DEFINITIONS, STARTER_MARKER_LAYOUTS } from './constants';
import { loadAppState, saveAppState } from './utils/storage';

const QUICK_ADD_OFFSETS = [
  { x: -0.08, y: -0.08 },
  { x: 0.08, y: -0.08 },
  { x: 0, y: 0 },
  { x: -0.08, y: 0.08 },
  { x: 0.08, y: 0.08 },
  { x: -0.16, y: 0 },
  { x: 0.16, y: 0 },
];

const PLAYER_LOOKUP = Object.fromEntries(PLAYER_DEFINITIONS.map((player) => [player.id, player]));

function createMarkerInstance(playerId, position) {
  const player = PLAYER_LOOKUP[playerId];

  return {
    id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerId: player.id,
    label: player.label,
    x: position.x,
    y: position.y,
  };
}

function getQuickAddPosition(courtMode, markerCount) {
  const anchor = courtMode === COURT_MODES.FULL ? { x: 0.75, y: 0.5 } : { x: 0.5, y: 0.5 };
  const offset = QUICK_ADD_OFFSETS[markerCount % QUICK_ADD_OFFSETS.length];

  return {
    x: Math.min(0.92, Math.max(0.08, anchor.x + offset.x)),
    y: Math.min(0.92, Math.max(0.08, anchor.y + offset.y)),
  };
}

function createMarkerLayoutInstances(layout) {
  return layout.map((marker) => ({
    ...marker,
    id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }));
}

function createStartingTwelveLayout() {
  return [
    { playerId: 'OH2', label: 'OH2', x: 0.16, y: 0.18 },
    { playerId: 'L', label: 'L', x: 0.15, y: 0.54 },
    { playerId: 'S', label: 'S', x: 0.15, y: 0.84 },
    { playerId: 'OP', label: 'OP', x: 0.43, y: 0.15 },
    { playerId: 'MB', label: 'MB', x: 0.42, y: 0.5 },
    { playerId: 'OH1', label: 'OH1', x: 0.43, y: 0.83 },
    { playerId: 'OH1', label: 'OH1', x: 0.59, y: 0.18 },
    { playerId: 'MB', label: 'MB', x: 0.58, y: 0.5 },
    { playerId: 'OP', label: 'OP', x: 0.58, y: 0.83 },
    { playerId: 'S', label: 'S', x: 0.84, y: 0.17 },
    { playerId: 'L', label: 'L', x: 0.84, y: 0.54 },
    { playerId: 'OH2', label: 'OH2', x: 0.84, y: 0.82 },
  ];
}

const STARTING_TWELVE_LAYOUT = createStartingTwelveLayout();

export default function App() {
  const [appState, setAppState] = useState(() => loadAppState());

  useEffect(() => {
    // Debounce writes slightly so rapid pointer moves do not thrash localStorage.
    const timeoutId = window.setTimeout(() => {
      saveAppState(appState);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [appState]);

  const activePlacedMarkers = useMemo(
    () => appState.placedMarkers[appState.courtMode],
    [appState.courtMode, appState.placedMarkers],
  );

  const activeDrawing = useMemo(
    () => appState.drawings[appState.courtMode],
    [appState.courtMode, appState.drawings],
  );

  const isMarkerSidebarOpen = appState.uiPreferences.isMarkerSidebarOpen;
  const themeMode = appState.uiPreferences.themeMode;

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  function updateCourtMode(courtMode) {
    setAppState((currentState) => ({
      ...currentState,
      courtMode,
    }));
  }

  function updateTool(activeTool) {
    setAppState((currentState) => ({
      ...currentState,
      toolSettings: {
        ...currentState.toolSettings,
        activeTool: currentState.toolSettings.activeTool === activeTool ? null : activeTool,
      },
    }));
  }

  function updateLineWidth(lineWidth) {
    setAppState((currentState) => ({
      ...currentState,
      toolSettings: {
        ...currentState.toolSettings,
        lineWidth,
      },
    }));
  }

  function updatePenColor(penColor) {
    setAppState((currentState) => ({
      ...currentState,
      toolSettings: {
        ...currentState.toolSettings,
        penColor,
      },
    }));
  }

  function addMarker(playerId, explicitPosition) {
    setAppState((currentState) => {
      const currentMarkers = currentState.placedMarkers[currentState.courtMode];
      const nextPosition =
        explicitPosition ?? getQuickAddPosition(currentState.courtMode, currentMarkers.length);

      return {
        ...currentState,
        placedMarkers: {
          ...currentState.placedMarkers,
          [currentState.courtMode]: [...currentMarkers, createMarkerInstance(playerId, nextPosition)],
        },
      };
    });
  }

  function updateMarkerPosition(markerId, nextPosition) {
    setAppState((currentState) => ({
      ...currentState,
      placedMarkers: {
        ...currentState.placedMarkers,
        [currentState.courtMode]: currentState.placedMarkers[currentState.courtMode].map((marker) =>
          marker.id === markerId ? { ...marker, ...nextPosition } : marker,
        ),
      },
    }));
  }

  function removeMarker(markerId) {
    setAppState((currentState) => ({
      ...currentState,
      placedMarkers: {
        ...currentState.placedMarkers,
        [currentState.courtMode]: currentState.placedMarkers[currentState.courtMode].filter(
          (marker) => marker.id !== markerId,
        ),
      },
    }));
  }

  function clearMarkers() {
    setAppState((currentState) => ({
      ...currentState,
      placedMarkers: {
        ...currentState.placedMarkers,
        [currentState.courtMode]: [],
      },
    }));
  }

  function loadStartingLineup() {
    setAppState((currentState) => ({
      ...currentState,
      placedMarkers: {
        ...currentState.placedMarkers,
        [currentState.courtMode]: createMarkerLayoutInstances(
          STARTER_MARKER_LAYOUTS[currentState.courtMode],
        ),
      },
    }));
  }

  function loadStartingTwelve() {
    if (appState.courtMode !== COURT_MODES.FULL) {
      return;
    }

    setAppState((currentState) => ({
      ...currentState,
      placedMarkers: {
        ...currentState.placedMarkers,
        [COURT_MODES.FULL]: createMarkerLayoutInstances(STARTING_TWELVE_LAYOUT),
      },
    }));
  }

  function appendDrawingStroke(stroke) {
    setAppState((currentState) => ({
      ...currentState,
      drawings: {
        ...currentState.drawings,
        [currentState.courtMode]: [...currentState.drawings[currentState.courtMode], stroke],
      },
    }));
  }

  function removeDrawingStroke(strokeId) {
    setAppState((currentState) => ({
      ...currentState,
      drawings: {
        ...currentState.drawings,
        [currentState.courtMode]: currentState.drawings[currentState.courtMode].filter(
          (stroke) => stroke.id !== strokeId,
        ),
      },
    }));
  }

  function toggleMarkerSidebar() {
    setAppState((currentState) => ({
      ...currentState,
      uiPreferences: {
        ...currentState.uiPreferences,
        isMarkerSidebarOpen: !currentState.uiPreferences.isMarkerSidebarOpen,
      },
    }));
  }

  function toggleThemeMode() {
    setAppState((currentState) => ({
      ...currentState,
      uiPreferences: {
        ...currentState.uiPreferences,
        themeMode: currentState.uiPreferences.themeMode === 'dark' ? 'light' : 'dark',
      },
    }));
  }

  function clearCurrentDrawing() {
    setAppState((currentState) => ({
      ...currentState,
      drawings: {
        ...currentState.drawings,
        [currentState.courtMode]: [],
      },
    }));
  }

  function resetBoard() {
    setAppState((currentState) => ({
      ...JSON.parse(JSON.stringify(DEFAULT_APP_STATE)),
      uiPreferences: {
        ...JSON.parse(JSON.stringify(DEFAULT_APP_STATE)).uiPreferences,
        themeMode: currentState.uiPreferences.themeMode,
      },
    }));
  }

  return (
    <div className="app-shell">
      <Toolbar
        courtMode={appState.courtMode}
        toolSettings={appState.toolSettings}
        themeMode={themeMode}
        onModeChange={updateCourtMode}
        onToolChange={updateTool}
        onLineWidthChange={updateLineWidth}
        onColorChange={updatePenColor}
        onClearDrawing={clearCurrentDrawing}
        onThemeToggle={toggleThemeMode}
        onReset={resetBoard}
      />

      <main className="app-main">
        <CourtBoard
          courtMode={appState.courtMode}
          placedMarkers={activePlacedMarkers}
          drawingStrokes={activeDrawing}
          toolSettings={appState.toolSettings}
          isMarkerSidebarOpen={isMarkerSidebarOpen}
          onMarkerAdd={addMarker}
          onMarkerMove={updateMarkerPosition}
          onMarkerRemove={removeMarker}
          onMarkersClear={clearMarkers}
          onLoadStartingLineup={loadStartingLineup}
          onLoadStartingTwelve={loadStartingTwelve}
          onDrawingStrokeCommit={appendDrawingStroke}
          onDrawingStrokeRemove={removeDrawingStroke}
          onToggleMarkerSidebar={toggleMarkerSidebar}
        />
      </main>
    </div>
  );
}
