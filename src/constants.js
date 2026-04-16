export const STORAGE_KEY = 'volley-sketch-state-v1';

export const COURT_MODES = {
  FULL: 'full',
  HALF: 'half',
};

export const PLAYER_DEFINITIONS = [
  { id: 'OH1', label: 'OH1' },
  { id: 'OH2', label: 'OH2' },
  { id: 'OP', label: 'OP' },
  { id: 'S', label: 'S' },
  { id: 'MB', label: 'MB' },
  { id: 'L', label: 'L' },
  { id: 'BLANK', label: '', bankLabel: 'Blank' },
];

export const DEFAULT_TOOL_SETTINGS = {
  activeTool: 'pen',
  penColor: '#124559',
  lineWidth: 4,
};

export const DEFAULT_UI_PREFERENCES = {
  isMarkerSidebarOpen: true,
  themeMode: 'light',
};

export const STARTER_PLAYER_POSITIONS = {
  [COURT_MODES.FULL]: {
    OH1: { x: 0.59, y: 0.18 },
    MB: { x: 0.58, y: 0.5 },
    OP: { x: 0.58, y: 0.82 },
    S: { x: 0.84, y: 0.18 },
    L: { x: 0.84, y: 0.54 },
    OH2: { x: 0.84, y: 0.81 },
  },
  [COURT_MODES.HALF]: {
    OH2: { x: 0.16, y: 0.18 },
    L: { x: 0.14, y: 0.5 },
    S: { x: 0.14, y: 0.86 },
    OP: { x: 0.82, y: 0.2 },
    MB: { x: 0.82, y: 0.5 },
    OH1: { x: 0.82, y: 0.88 },
  },
};

export const STARTER_MARKER_LAYOUTS = Object.fromEntries(
  Object.entries(STARTER_PLAYER_POSITIONS).map(([mode, positions]) => [
    mode,
    PLAYER_DEFINITIONS.filter((player) => positions[player.id]).map((player) => ({
      playerId: player.id,
      label: player.label,
      x: positions[player.id].x,
      y: positions[player.id].y,
    })),
  ]),
);

export const DEFAULT_DRAWINGS = {
  [COURT_MODES.FULL]: [],
  [COURT_MODES.HALF]: [],
};

export const DEFAULT_PLACED_MARKERS = {
  [COURT_MODES.FULL]: [],
  [COURT_MODES.HALF]: [],
};

export const DEFAULT_APP_STATE = {
  courtMode: COURT_MODES.FULL,
  placedMarkers: DEFAULT_PLACED_MARKERS,
  drawings: DEFAULT_DRAWINGS,
  toolSettings: DEFAULT_TOOL_SETTINGS,
  uiPreferences: DEFAULT_UI_PREFERENCES,
};

export const COURT_DIMENSIONS = {
  [COURT_MODES.FULL]: {
    width: 18,
    height: 9,
    viewBox: '0 0 18 9',
    aspectRatio: '18 / 9',
  },
  [COURT_MODES.HALF]: {
    width: 9,
    height: 9,
    viewBox: '0 0 9 9',
    aspectRatio: '1 / 1',
  },
};
