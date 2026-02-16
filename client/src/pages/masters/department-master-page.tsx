import { AppLayout } from "@/components/layout/app-layout";
import { DepartmentForm } from "@/components/departments/department-form";

export default function DepartmentMasterPage() {
  const handleSuccess = () => {
    // Optionally redirect or show more info
  };

  return (
    <AppLayout>
      <div className="p-6">
        <DepartmentForm onSuccess={handleSuccess} />
      </div>
    </AppLayout>
  );
}
