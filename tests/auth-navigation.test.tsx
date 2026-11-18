// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AppSidebar } from "@/components/app-sidebar";
import LoginPage from "@/app/login/page";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  clear: vi.fn(),
  request: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/leads",
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: mocks.clear }),
}));
vi.mock("@/lib/api-client", () => ({ apiRequest: mocks.request }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.request.mockResolvedValue({});
});
afterEach(cleanup);

it("allows signing out again when Next preserves the sidebar after another login", async () => {
  const view = render(<AppSidebar user={{ name: "Admin", role: "ADMIN" }} />);
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
  view.rerender(<AppSidebar user={{ name: "Agent", role: "AGENT" }} />);
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(2));
});

it("keeps duplicate logout requests blocked while the request is in flight", async () => {
  let complete!: (value: object) => void;
  mocks.request.mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  render(<AppSidebar user={{ name: "Admin", role: "ADMIN" }} />);
  const button = screen.getByRole("button", { name: "Sign out" });
  fireEvent.click(button);
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(mocks.request).toHaveBeenCalledTimes(1);
  complete({});
  await waitFor(() => expect(button).toBeEnabled());
});

it("resets a preserved login form after successful authentication", async () => {
  const view = render(<LoginPage />);
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "admin@aqary.demo" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "AqaryDemo2026!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/leads"));
  view.rerender(<LoginPage />);
  expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
});
