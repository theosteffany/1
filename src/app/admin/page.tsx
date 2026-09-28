import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SetupNotice } from "@/components/admin/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return <AdminDashboard />;
}
