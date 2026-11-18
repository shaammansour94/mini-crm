// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { FormBuilderPage } from "@/features/form-builder/components/form-builder";
import { NavigationGuardProvider } from "@/components/navigation-guard";
import {
  initialFields,
  type FormField,
} from "@/features/form-builder/form-schema";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
// Simulate Next's onNavigate contract without rendering an application router.
vi.mock("next/link", () => ({
  default: ({
    href,
    onNavigate,
    children,
    ...props
  }: {
    href: string;
    onNavigate?: (event: { preventDefault: () => void }) => void;
    children: React.ReactNode;
  }) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        let blocked = false;
        onNavigate?.({
          preventDefault: () => {
            blocked = true;
          },
        });
        if (!blocked) mocks.push(href);
      }}
    >
      {children}
    </a>
  ),
}));
vi.mock("@/features/form-builder/form-schema.queries", () => ({
  useFormSchema: () => ({
    data: {
      data: { fields: initialFields, updatedAt: "2026-11-17T09:00:00Z" },
    },
  }),
  useSaveSchema: () => ({ isPending: false, mutateAsync: mocks.save }),
}));
vi.mock("@/features/form-builder/components/field-canvas", () => ({
  FieldCanvas: ({
    fields,
    onSelect,
  }: {
    fields: FormField[];
    onSelect: (id: string) => void;
  }) => (
    <div>
      {fields.map((field) => (
        <button key={field.id} onClick={() => onSelect(field.id)}>
          Select {field.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("@/features/form-builder/components/form-preview", () => ({
  FormPreview: ({ onClose }: { onClose: () => void }) => (
    <button onClick={onClose}>Close preview</button>
  ),
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.save.mockImplementation(async (fields: FormField[]) => ({
    data: { fields, updatedAt: "2026-11-18T09:00:00Z" },
  }));
});
afterEach(cleanup);
function setup() {
  return render(
    <NavigationGuardProvider>
      <FormBuilderPage />
    </NavigationGuardProvider>,
  );
}
function editName() {
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "Updated name" },
  });
}
function unload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

it("selection and preview do not create history or dirty state; undo back to saved clears dirty", () => {
  setup();
  expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Select Email" }));
  fireEvent.click(screen.getByRole("button", { name: "Preview" }));
  fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
  expect(screen.getByRole("button", { name: "Save form" })).toBeDisabled();
  expect(unload()).toBe(false);
  editName();
  expect(unload()).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.getByRole("button", { name: "Save form" })).toBeDisabled();
  expect(unload()).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Redo" }));
  expect(screen.getByRole("button", { name: "Save form" })).toBeEnabled();
});
it("keeps draft and history on failed save, then clears history and warnings after successful save", async () => {
  setup();
  editName();
  fireEvent.change(screen.getByLabelText("Placeholder"), {
    target: { value: "New placeholder" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  mocks.save.mockRejectedValueOnce(new Error("Save failed"));
  fireEvent.click(screen.getByRole("button", { name: "Save form" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Label")).toHaveValue("Updated name");
  expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Redo" })).toBeEnabled();
  expect(unload()).toBe(true);
  fireEvent.click(screen.getByRole("link", { name: "Back to leads" }));
  expect(screen.getByRole("alertdialog")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Stay on page" }));
  fireEvent.click(screen.getByRole("button", { name: "Save form" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save form" })).toBeDisabled(),
  );
  expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  expect(unload()).toBe(false);
  fireEvent.click(screen.getByRole("link", { name: "Back to leads" }));
  expect(mocks.push).toHaveBeenCalledWith("/leads");
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});
it("cancels navigation without losing edits, and discards them when leaving is confirmed", () => {
  setup();
  editName();
  fireEvent.click(screen.getByRole("link", { name: "Back to leads" }));
  expect(screen.getByRole("alertdialog")).toHaveTextContent(
    "You have unsaved changes. Are you sure you want to leave?",
  );
  expect(mocks.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Stay on page" }));
  expect(screen.getByLabelText("Label")).toHaveValue("Updated name");
  expect(unload()).toBe(true);
  fireEvent.click(screen.getByRole("link", { name: "Back to leads" }));
  fireEvent.click(screen.getByRole("button", { name: "Leave without saving" }));
  expect(mocks.push).toHaveBeenCalledWith("/leads", { scroll: undefined });
  expect(screen.getByLabelText("Label")).toHaveValue("Name");
  expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  expect(unload()).toBe(false);
});

it("guards cancelable browser history traversal without changing Next router methods", () => {
  type Navigation = NonNullable<Window["navigation"]>;
  let listener: Parameters<Navigation["addEventListener"]>[1] | undefined;
  const traverseTo = vi.fn(() => ({ finished: Promise.resolve() }));
  window.navigation = {
    addEventListener: (_type, callback) => {
      listener = callback;
    },
    removeEventListener: () => {
      listener = undefined;
    },
    traverseTo,
  };
  try {
    setup();
    editName();
    const event = () =>
      Object.assign(new Event("navigate", { cancelable: true }), {
        navigationType: "traverse",
        canIntercept: true,
        destination: {
          key: "previous-entry",
          url: "http://localhost/leads",
          sameDocument: true,
        },
      });
    const back = event();
    act(() => {
      listener?.(back);
    });
    expect(back.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Stay on page" }));
    expect(traverseTo).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Label")).toHaveValue("Updated name");
    act(() => {
      listener?.(event());
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Leave without saving" }),
    );
    expect(traverseTo).toHaveBeenCalledWith("previous-entry");
  } finally {
    cleanup();
    delete window.navigation;
  }
});

it("dismisses an open leave warning if an in-flight save succeeds", async () => {
  let finish!: (result: {
    data: { fields: FormField[]; updatedAt: string };
  }) => void;
  mocks.save.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  setup();
  editName();
  fireEvent.click(screen.getByRole("button", { name: "Save form" }));
  fireEvent.click(screen.getByRole("link", { name: "Back to leads" }));
  expect(screen.getByRole("alertdialog")).toBeVisible();
  finish({
    data: {
      fields: initialFields.map((field) =>
        field.id === "name" ? { ...field, label: "Updated name" } : field,
      ),
      updatedAt: "2026-11-18T09:00:00Z",
    },
  });
  await waitFor(() =>
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  expect(unload()).toBe(false);
  expect(mocks.push).not.toHaveBeenCalled();
});
