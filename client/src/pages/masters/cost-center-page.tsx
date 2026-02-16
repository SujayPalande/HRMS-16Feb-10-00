import { AppLayout } from "@/components/layout/app-layout";
import { CostCenterForm } from "@/components/cost-center-form";

export default function CostCenterPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <CostCenterForm />
      </div>
    </AppLayout>
  );
}
