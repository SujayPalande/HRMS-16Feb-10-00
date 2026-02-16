import { AppLayout } from "@/components/layout/app-layout";
import { CategoryMasterForm } from "@/components/category-master-form";

export default function CategoryMasterPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <CategoryMasterForm />
      </div>
    </AppLayout>
  );
}
