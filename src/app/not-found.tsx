import { ErrorScreen } from "@/components/error-screen";

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="Page not found"
      description="We couldn't find the page you're looking for. It may have moved, or the link may be incorrect."
    />
  );
}
