// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";
import { DynamicFields } from "@/features/form-builder/components/dynamic-fields";
import {
  defaultValues,
  initialFields,
  validateLeadValues,
  type FieldErrors,
} from "@/features/form-builder/form-schema";
afterEach(cleanup);
function FormHarness() {
  const [values, setValues] = useState(() => ({
    ...defaultValues(initialFields),
    name: "Sara",
    email: "sara@example.com",
    status: "New",
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErrors(validateLeadValues(initialFields, values));
      }}
    >
      <DynamicFields
        fields={initialFields}
        values={values}
        errors={errors}
        onChange={(id, value) => setValues((old) => ({ ...old, [id]: value }))}
      />
      <button>Save</button>
    </form>
  );
}
it("shows and requires Loss reason on Lost, then allows the same submission when hidden", () => {
  render(<FormHarness />);
  expect(screen.queryByLabelText(/Loss reason/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Status/), {
    target: { value: "Lost" },
  });
  expect(screen.getByLabelText(/Loss reason/)).toBeVisible();
  fireEvent.click(screen.getByText("Save"));
  expect(screen.getByText("This field is required.")).toBeVisible();
  expect(screen.getByLabelText(/Loss reason/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  fireEvent.change(screen.getByLabelText(/Status/), {
    target: { value: "Qualified" },
  });
  fireEvent.click(screen.getByText("Save"));
  expect(screen.queryByLabelText(/Loss reason/)).not.toBeInTheDocument();
  expect(screen.queryByText("This field is required.")).not.toBeInTheDocument();
  expect(screen.getByLabelText(/Name/)).toHaveValue("Sara");
});
