import { Suspense } from "react";
import ForgotOtpClient from "./ForgotOtpClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading verification...</div>}>
      <ForgotOtpClient />
    </Suspense>
  );
}