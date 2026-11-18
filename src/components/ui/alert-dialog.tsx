"use client";

import type { ComponentProps } from "react";
import { AlertDialog as Primitive } from "radix-ui";
import { Button } from "./button";

export const AlertDialog = Primitive.Root;
export const AlertDialogTitle = Primitive.Title;
export const AlertDialogDescription = Primitive.Description;

export function AlertDialogContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
      <Primitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 text-card-foreground shadow-xl">
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
export function AlertDialogCancel(props: ComponentProps<typeof Button>) {
  return (
    <Primitive.Cancel asChild>
      <Button variant="outline" {...props} />
    </Primitive.Cancel>
  );
}
export function AlertDialogAction(props: ComponentProps<typeof Button>) {
  return (
    <Primitive.Action asChild>
      <Button {...props} />
    </Primitive.Action>
  );
}
