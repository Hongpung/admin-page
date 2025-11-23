import { Suspense } from "react";
import LoadingIndicator from "@admin/shared/components/LoadingIndicator";
import { AdminManagePage } from "./_components/AdminManagePage";

export default function Page() {
  return (
    <Suspense fallback={<LoadingIndicator style="min-h-[40vh]" />}>
      <AdminManagePage />
    </Suspense>
  );
}
