"use client";

import { useCallback, useReducer } from "react";
import type { FormField } from "./form-schema";

const historyLimit = 30;
const textEditDelay = 700;
export type DraftHistory = {
  entries: FormField[][];
  index: number;
  group?: string;
  editedAt?: number;
};
type HistoryAction =
  | { type: "change"; fields: FormField[]; group?: string; time: number }
  | { type: "undo" | "redo" | "end-group" }
  | { type: "reset"; fields: FormField[] };

export function initialHistory(fields: FormField[]): DraftHistory {
  return { entries: [structuredClone(fields)], index: 0 };
}

export function draftHistoryReducer(
  state: DraftHistory,
  action: HistoryAction,
): DraftHistory {
  switch (action.type) {
    case "reset":
      return initialHistory(action.fields);
    case "end-group":
      return { ...state, group: undefined };
    case "undo":
      return {
        ...state,
        index: Math.max(0, state.index - 1),
        group: undefined,
      };
    case "redo":
      return {
        ...state,
        index: Math.min(state.entries.length - 1, state.index + 1),
        group: undefined,
      };
    case "change": {
      if (
        JSON.stringify(state.entries[state.index]) ===
        JSON.stringify(action.fields)
      )
        return state;
      const entries = state.entries.slice(0, state.index + 1);
      const grouped =
        action.group &&
        action.group === state.group &&
        action.time - (state.editedAt ?? 0) < textEditDelay;
      if (grouped) entries[entries.length - 1] = structuredClone(action.fields);
      else entries.push(structuredClone(action.fields));
      const bounded = entries.slice(-historyLimit);
      return {
        entries: bounded,
        index: bounded.length - 1,
        group: action.group,
        editedAt: action.time,
      };
    }
  }
}

export function useDraftHistory(fields: FormField[]) {
  const [history, dispatch] = useReducer(
    draftHistoryReducer,
    fields,
    initialHistory,
  );
  const reset = useCallback(
    (next: FormField[]) => dispatch({ type: "reset", fields: next }),
    [],
  );
  return {
    fields: history.entries[history.index],
    canUndo: history.index > 0,
    canRedo: history.index < history.entries.length - 1,
    change: (next: FormField[], group?: string) =>
      dispatch({ type: "change", fields: next, group, time: Date.now() }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    endGroup: () => dispatch({ type: "end-group" }),
    reset,
  };
}
