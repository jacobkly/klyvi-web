import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Create your account · Klyvi" };

export default function Page() {
  return <AuthForm mode="signup" />;
}
