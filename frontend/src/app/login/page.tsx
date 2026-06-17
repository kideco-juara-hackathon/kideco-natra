import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login Dispatcher | Kideco Logistics Control",
  description: "Akses dispatcher internal untuk Kontrol Logistik Kideco.",
};

export default function LoginPage() {
  return <LoginForm />;
}

