import { Suspense } from "react";
import { ReportsContent } from "./ReportsContent";

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted">
          Ładowanie…
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
