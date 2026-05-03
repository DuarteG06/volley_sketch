import {
  COURT_MODES,
  DEFAULT_APP_STATE,
  DEFAULT_DRAWINGS,
  DEFAULT_PLACED_MARKERS,
  DEFAULT_TOOL_SETTINGS,
  DEFAULT_UI_PREFERENCES,
  PLAYER_DEFINITIONS,
  STARTER_MARKER_LAYOUTS,
  STORAGE_KEY,
  TOOLS,
} from '../constants';

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_APP_STATE));
}

function sanitizePoint(point) {
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
    return null;
  }

  return {
    x: Math.min(1, Math.max(0, point.x)),
    y: Math.min(1, Math.max(0, point.y)),
  };
}

function sanitizeStroke(stroke) {
  if (!stroke || !Array.isArray(stroke.points) || stroke.points.length === 0) {
    return null;
  }

  const points = stroke.points.map(sanitizePoint).filter(Boolean);

  if (!points.length) {
    return null;
  }

  return {
    id: typeof stroke.id === 'string' ? stroke.id : `stroke-${Date.now()}`,
    tool: stroke.tool === TOOLS.ERASER ? TOOLS.ERASER : TOOLS.PEN,
    color: typeof stroke.color === 'string' ? stroke.color : DEFAULT_TOOL_SETTINGS.penColor,
    lineWidth:
      typeof stroke.lineWidth === 'number' && stroke.lineWidth > 0
        ? stroke.lineWidth
        : DEFAULT_TOOL_SETTINGS.lineWidth,
    points,
  };
}

function normalizePlayerIdentity(rawPlayerId, rawLabel) {
  const normalizedPlayerId =
    rawPlayerId === 'MB1' || rawPlayerId === 'MB2' || rawLabel === 'MB1' || rawLabel === 'MB2'
      ? 'MB'
      : rawPlayerId;

  const fallbackPlayer =
    PLAYER_DEFINITIONS.find((player) => player.id === normalizedPlayerId) ??
    PLAYER_DEFINITIONS.find((player) => player.label === rawLabel);

  return {
    playerId: fallbackPlayer?.id ?? 'custom',
    label: fallbackPlayer?.label ?? (rawLabel === 'MB1' || rawLabel === 'MB2' ? 'MB' : rawLabel ?? 'P'),
  };
}

function sanitizePlacedMarker(marker) {
  const normalizedPlayer = normalizePlayerIdentity(marker?.playerId, marker?.label);
  const point = sanitizePoint(marker);

  if (!point) {
    return null;
  }

  return {
    id: typeof marker.id === 'string' ? marker.id : `marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerId: normalizedPlayer.playerId,
    label: normalizedPlayer.label,
    x: point.x,
    y: point.y,
  };
}

function migrateLegacyPlayerPositions(legacyPositions) {
  const migratedMarkers = {};

  for (const mode of Object.values(COURT_MODES)) {
    const fallbackLayout = STARTER_MARKER_LAYOUTS[mode];
    const storedPositions = legacyPositions?.[mode];

    migratedMarkers[mode] = storedPositions
      ? PLAYER_DEFINITIONS.map((player) => {
          const point =
            player.id === 'MB'
              ? sanitizePoint(storedPositions.MB ?? storedPositions.MB1 ?? storedPositions.MB2)
              : sanitizePoint(storedPositions[player.id]);

          if (!point) {
            return null;
          }

          return {
            id: `marker-${mode}-${player.id}`,
            playerId: player.id,
            label: player.label,
            x: point.x,
            y: point.y,
          };
        }).filter(Boolean)
      : fallbackLayout.map((marker) => ({
          ...marker,
          id: `marker-${mode}-${marker.playerId}`,
        }));
  }

  return migratedMarkers;
}

export function loadAppState() {
  if (typeof window === 'undefined') {
    return cloneDefaults();
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return cloneDefaults();
    }

    const parsedState = JSON.parse(rawState);
    const state = cloneDefaults();

    if (parsedState.courtMode === COURT_MODES.HALF || parsedState.courtMode === COURT_MODES.FULL) {
      state.courtMode = parsedState.courtMode;
    }

    const storedPlacedMarkers =
      parsedState.placedMarkers ?? migrateLegacyPlayerPositions(parsedState.playerPositions);

    for (const mode of Object.values(COURT_MODES)) {
      const storedMarkers = storedPlacedMarkers?.[mode];
      state.placedMarkers[mode] = Array.isArray(storedMarkers)
        ? storedMarkers.map(sanitizePlacedMarker).filter(Boolean)
        : DEFAULT_PLACED_MARKERS[mode];

      const storedDrawings = parsedState.drawings?.[mode];
      state.drawings[mode] = Array.isArray(storedDrawings)
        ? storedDrawings.map(sanitizeStroke).filter(Boolean)
        : DEFAULT_DRAWINGS[mode];
    }

    if (parsedState.toolSettings) {
      const storedTool = parsedState.toolSettings.activeTool;
      const activeTool =
        storedTool === TOOLS.POINTER ||
        storedTool === TOOLS.PEN ||
        storedTool === TOOLS.ERASER ||
        storedTool === TOOLS.LINE_ERASER ||
        storedTool === null
          ? storedTool
          : DEFAULT_TOOL_SETTINGS.activeTool;

      state.toolSettings = {
        activeTool,
        penColor:
          typeof parsedState.toolSettings.penColor === 'string'
            ? parsedState.toolSettings.penColor
            : DEFAULT_TOOL_SETTINGS.penColor,
        lineWidth:
          typeof parsedState.toolSettings.lineWidth === 'number' &&
          parsedState.toolSettings.lineWidth > 0
            ? parsedState.toolSettings.lineWidth
            : DEFAULT_TOOL_SETTINGS.lineWidth,
      };
    }

    if (parsedState.uiPreferences) {
      state.uiPreferences = {
        isMarkerSidebarOpen:
          typeof parsedState.uiPreferences.isMarkerSidebarOpen === 'boolean'
            ? parsedState.uiPreferences.isMarkerSidebarOpen
            : DEFAULT_UI_PREFERENCES.isMarkerSidebarOpen,
        themeMode:
          parsedState.uiPreferences.themeMode === 'dark' ? 'dark' : DEFAULT_UI_PREFERENCES.themeMode,
      };
    }

    return state;
  } catch (error) {
    console.warn('Unable to load saved sketch state. Using defaults instead.', error);
    return cloneDefaults();
  }
}

export function saveAppState(nextState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}
