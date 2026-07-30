import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign in · Klyvi" };

export default function Page() {
  return <AuthForm mode="signin" />;
}
