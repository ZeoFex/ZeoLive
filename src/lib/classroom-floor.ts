export const FLOOR_TOPIC = "floor";

export type FloorKind = "screen" | "board";

export type FloorHolder = {
  identity: string;
  name: string;
};

export type FloorRequest = {
  id: string;
  identity: string;
  name: string;
  kind: FloorKind;
  at: number;
};

export type FloorState = {
  screen: FloorHolder | null;
  board: FloorHolder | null;
  requests: FloorRequest[];
};

export type FloorAction =
  | {
      type: "request";
      identity: string;
      name: string;
      kind: FloorKind;
      id: string;
      at: number;
    }
  | { type: "cancel"; identity: string; kind: FloorKind }
  | { type: "grant"; identity: string; name: string; kind: FloorKind }
  | { type: "deny"; identity: string; kind: FloorKind }
  | { type: "revoke"; identity: string; kind: FloorKind }
  | { type: "release"; identity: string };

const MAX_REQUESTS = 40;

export function emptyFloor(): FloorState {
  return { screen: null, board: null, requests: [] };
}

function cleanName(name: string) {
  const trimmed = name.replace(/\s+/g, " ").trim();
  return trimmed.slice(0, 80) || "Student";
}

function withoutRequest(state: FloorState, identity: string, kind?: FloorKind): FloorRequest[] {
  return state.requests.filter(
    (request) => request.identity !== identity || (kind !== undefined && request.kind !== kind)
  );
}

export function reduceFloor(state: FloorState, action: FloorAction): FloorState {
  if (action.type === "request") {
    const name = cleanName(action.name);
    const holder = action.kind === "screen" ? state.screen : state.board;
    if (holder?.identity === action.identity) return state;
    if (state.requests.some((request) => request.identity === action.identity && request.kind === action.kind)) {
      return state;
    }
    if (state.requests.length >= MAX_REQUESTS) return state;
    return {
      ...state,
      requests: [
        ...state.requests,
        {
          id: action.id,
          identity: action.identity,
          name,
          kind: action.kind,
          at: action.at,
        },
      ],
    };
  }

  if (action.type === "cancel" || action.type === "deny") {
    const requests = withoutRequest(state, action.identity, action.kind);
    if (requests.length === state.requests.length) return state;
    return { ...state, requests };
  }

  if (action.type === "grant") {
    const name = cleanName(action.name);
    const holder = { identity: action.identity, name };
    const requests = withoutRequest(state, action.identity, action.kind);
    if (action.kind === "screen") {
      if (state.screen?.identity === action.identity && requests.length === state.requests.length) return state;
      return { ...state, screen: holder, requests };
    }
    if (state.board?.identity === action.identity && requests.length === state.requests.length) return state;
    return { ...state, board: holder, requests };
  }

  if (action.type === "revoke") {
    const holder = action.kind === "screen" ? state.screen : state.board;
    const requests = withoutRequest(state, action.identity, action.kind);
    if (holder?.identity !== action.identity && requests.length === state.requests.length) return state;
    if (action.kind === "screen") {
      return {
        ...state,
        screen: holder?.identity === action.identity ? null : state.screen,
        requests,
      };
    }
    return {
      ...state,
      board: holder?.identity === action.identity ? null : state.board,
      requests,
    };
  }

  const requests = state.requests.filter((request) => request.identity !== action.identity);
  const screen = state.screen?.identity === action.identity ? null : state.screen;
  const board = state.board?.identity === action.identity ? null : state.board;
  if (screen === state.screen && board === state.board && requests.length === state.requests.length) {
    return state;
  }
  return { screen, board, requests };
}
