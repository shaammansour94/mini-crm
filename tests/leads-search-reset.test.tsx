// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { Activity } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LeadsTable } from "@/features/leads/leads-table";

const navigation = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock("@/features/leads/leads.queries", () => ({
  useLeads: () => ({
    isPending: false,
    isError: false,
    isSuccess: true,
    data: { data: [], total: 0 },
    error: null,
  }),
}));
beforeEach(() => {
  navigation.search = "";
});
afterEach(cleanup);

function CachedList({ visible }: { visible: boolean }) {
  return (
    <Activity mode={visible ? "visible" : "hidden"}>
      <LeadsTable />
    </Activity>
  );
}

it("clears search and status when returning from details to the cached list", () => {
  const view = render(<CachedList visible />);
  fireEvent.change(
    screen.getByRole("textbox", { name: "Search name or email" }),
    { target: { value: "Sara" } },
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Filter by status" }), {
    target: { value: "New" },
  });
  expect(
    screen.getByRole("textbox", { name: "Search name or email" }),
  ).toHaveValue("Sara");
  view.rerender(<CachedList visible={false} />);
  view.rerender(<CachedList visible />);
  expect(
    screen.getByRole("textbox", { name: "Search name or email" }),
  ).toHaveValue("");
  expect(
    screen.getByRole("combobox", { name: "Filter by status" }),
  ).toHaveValue("");
});

it("clears search after repeated edits while preserving successful-save feedback", () => {
  const view = render(<CachedList visible />);
  for (let edit = 0; edit < 2; edit++) {
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search name or email" }),
      { target: { value: "Sara" } },
    );
    view.rerender(<CachedList visible={false} />);
    navigation.search = "saved=updated";
    view.rerender(<CachedList visible />);
    expect(
      screen.getByRole("textbox", { name: "Search name or email" }),
    ).toHaveValue("");
    expect(screen.getByText("Lead updated successfully.")).toBeVisible();
  }
});
