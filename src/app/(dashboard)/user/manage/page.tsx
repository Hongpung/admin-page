import { Suspense } from "react";
import LoadingIndicator from "@admin/shared/components/LoadingIndicator";
import { ManageUserPage } from "./_components/ManageUserPage";

export default function Page() {
  return (
    <Suspense fallback={<LoadingIndicator style="min-h-[40vh]" />}>
      <ManageUserPage />
    </Suspense>
  );
}
