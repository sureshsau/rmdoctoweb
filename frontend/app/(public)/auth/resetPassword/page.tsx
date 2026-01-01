import { Suspense } from "react";
import ResetPasswordPage from "./ResetPasswordClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading reset password...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
