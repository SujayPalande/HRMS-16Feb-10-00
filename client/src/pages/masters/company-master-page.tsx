import { AppLayout } from "@/components/layout/app-layout";
import { CompanyMasterForm } from "@/components/company-master-form";

export default function CompanyMasterPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <CompanyMasterForm />
      </div>
    </AppLayout>
  );
}
