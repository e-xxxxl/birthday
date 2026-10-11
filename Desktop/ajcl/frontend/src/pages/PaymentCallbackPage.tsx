import { PaymentCallback } from "@/components/booking/PaymentCallback";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function PaymentCallbackPage() {
  useDocumentTitle("Confirming payment");
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <PaymentCallback />
    </div>
  );
}
