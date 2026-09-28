import { LoginForm } from "@/components/admin/LoginForm";
import { SetupNotice } from "@/components/admin/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return <LoginForm />;
}
