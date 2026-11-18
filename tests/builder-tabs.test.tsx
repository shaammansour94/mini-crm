// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { Activity } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FormBuilderPage } from "@/features/form-builder/components/form-builder";
import {
  initialFields,
  type FormField,
} from "@/features/form-builder/form-schema";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/features/form-builder/form-schema.queries", () => ({
  useFormSchema: () => ({
    data: {
      data: { fields: initialFields, updatedAt: "2026-11-17T09:00:00Z" },
    },
  }),
  useSaveSchema: () => ({ isPending: false }),
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
afterEach(cleanup);

function CachedBuilder({ visible }: { visible: boolean }) {
  return (
    <Activity mode={visible ? "visible" : "hidden"}>
      <FormBuilderPage />
    </Activity>
  );
}

it("opens Canvas again after returning, while retaining the draft and field-selection behavior", () => {
  const view = render(<CachedBuilder visible />);
  expect(screen.getByRole("tab", { name: "Canvas" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Select Name" }));
  expect(screen.getByRole("tab", { name: "Properties" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "Customer name draft" },
  });
  view.rerender(<CachedBuilder visible={false} />);
  view.rerender(<CachedBuilder visible />);
  expect(screen.getByRole("tab", { name: "Canvas" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByRole("tab", { name: "Properties" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Select Customer name draft" }),
  );
  expect(screen.getByRole("tab", { name: "Properties" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByLabelText("Label")).toHaveValue("Customer name draft");
});
