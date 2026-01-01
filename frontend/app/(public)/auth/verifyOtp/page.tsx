import { Suspense } from "react";
import  VerifyOTPPage from "./verifyOtp";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading reset password...</div>}>
      <VerifyOTPPage />
    </Suspense>
  );
}
