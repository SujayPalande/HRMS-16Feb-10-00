import { AppLayout } from "@/components/layout/app-layout";
import { BankMasterForm } from "@/components/bank-master-form";

export default function BankMasterPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <BankMasterForm />
      </div>
    </AppLayout>
  );
}
