import { describe, expect, it } from "vitest";
import {
  draftHistoryReducer,
  initialHistory,
} from "@/features/form-builder/draft-history";
import {
  initialFields,
  type FormField,
} from "@/features/form-builder/form-schema";

const rename = (fields: FormField[], label: string) =>
  fields.map((f) => (f.id === "name" ? { ...f, label } : f));
const current = (state: ReturnType<typeof initialHistory>) =>
  state.entries[state.index];
describe("builder draft history", () => {
  it("supports undo, redo and stable IDs across add, remove, reorder and property changes", () => {
    const extra: FormField = {
      id: "custom_id",
      type: "dropdown",
      label: "Custom",
      required: false,
      options: ["A", "B"],
    };
    const snapshots = [
      [...initialFields, extra],
      [
        ...initialFields,
        {
          ...extra,
          label: "Renamed",
          required: true,
          options: ["A", "B", "C"],
          visibility: { fieldId: "status", equals: "Lost" },
        },
      ].reverse(),
      [...initialFields].reverse(),
    ];
    let state = initialHistory(initialFields);
    snapshots.forEach((fields, time) => {
      state = draftHistoryReducer(state, { type: "change", fields, time });
    });
    expect(current(state)).toEqual(snapshots[2]);
    for (const expected of [snapshots[1], snapshots[0], initialFields]) {
      state = draftHistoryReducer(state, { type: "undo" });
      expect(current(state)).toEqual(expected);
    }
    for (const expected of snapshots) {
      state = draftHistoryReducer(state, { type: "redo" });
      expect(current(state)).toEqual(expected);
    }
  });
  it("drops redo when making a new edit after undo", () => {
    let state = initialHistory(initialFields);
    state = draftHistoryReducer(state, {
      type: "change",
      fields: rename(initialFields, "First"),
      time: 0,
    });
    state = draftHistoryReducer(state, {
      type: "change",
      fields: rename(initialFields, "Second"),
      time: 1,
    });
    state = draftHistoryReducer(state, { type: "undo" });
    state = draftHistoryReducer(state, {
      type: "change",
      fields: rename(initialFields, "Branch"),
      time: 2,
    });
    expect(current(draftHistoryReducer(state, { type: "redo" }))[0].label).toBe(
      "Branch",
    );
    expect(state.entries.some((fields) => fields[0].label === "Second")).toBe(
      false,
    );
  });
  it("groups consecutive typing, separates pauses and ends the group on blur", () => {
    let state = initialHistory(initialFields);
    for (const [time, label] of [
      [0, "N"],
      [100, "Na"],
      [200, "Name edited"],
    ] as const) {
      state = draftHistoryReducer(state, {
        type: "change",
        fields: rename(initialFields, label),
        group: "name:label",
        time,
      });
    }
    expect(state.entries).toHaveLength(2);
    expect(current(draftHistoryReducer(state, { type: "undo" }))).toEqual(
      initialFields,
    );
    state = draftHistoryReducer(state, {
      type: "change",
      fields: rename(initialFields, "After pause"),
      group: "name:label",
      time: 1000,
    });
    expect(state.entries).toHaveLength(3);
    state = draftHistoryReducer(state, { type: "end-group" });
    state = draftHistoryReducer(state, {
      type: "change",
      fields: rename(initialFields, "New focus"),
      group: "name:label",
      time: 1100,
    });
    expect(state.entries).toHaveLength(4);
  });
  it("bounds history to 30 snapshots including the current draft", () => {
    let state = initialHistory(initialFields);
    for (let i = 0; i < 50; i++)
      state = draftHistoryReducer(state, {
        type: "change",
        fields: rename(initialFields, `Name ${i}`),
        time: i,
      });
    expect(state.entries).toHaveLength(30);
    for (let i = 0; i < 50; i++)
      state = draftHistoryReducer(state, { type: "undo" });
    expect(state.index).toBe(0);
    expect(current(state)[0].label).toBe("Name 20");
  });
  it("resets history to the saved snapshot and ignores no-op changes", () => {
    let state = initialHistory(initialFields);
    expect(
      draftHistoryReducer(state, {
        type: "change",
        fields: initialFields,
        time: 0,
      }),
    ).toBe(state);
    state = draftHistoryReducer(state, {
      type: "change",
      fields: rename(initialFields, "Saved"),
      time: 1,
    });
    state = draftHistoryReducer(state, {
      type: "reset",
      fields: current(state),
    });
    expect(state.entries).toHaveLength(1);
    expect(state.index).toBe(0);
    expect(current(draftHistoryReducer(state, { type: "undo" }))[0].label).toBe(
      "Saved",
    );
  });
});
