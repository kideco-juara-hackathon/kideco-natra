"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";

import { LoginCarousel } from "@/components/auth/login-carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  authenticateDispatcher,
  createPrototypeSession,
  DEMO_DISPATCHER,
  hasPrototypeSession,
} from "@/lib/prototype-auth";

export function LoginForm() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasPrototypeSession()) {
      router.replace("/");
    }
  }, [router]);

  function attemptLogin() {
    setError("");

    if (!authenticateDispatcher(employeeId, password)) {
      setError("ID dispatcher atau password tidak sesuai.");
      return;
    }

    setSubmitting(true);
    createPrototypeSession();
    router.replace("/");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    attemptLogin();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#211917]">
      <LoginCarousel />

      {/* Left panel */}
      <section className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white px-6 py-10 sm:px-10 md:px-12 lg:px-16 md:w-[50%] md:shadow-[16px_0_48px_rgba(0,0,0,0.10)]">

        {/* Warm brand radial tint — very subtle */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_0%,rgba(232,27,45,0.045),transparent)]" />

        <div className="relative z-10 w-full max-w-[400px]">

          {/* Heading */}
          <div className="mt-8 text-center">
            <Image
              alt="NATRA"
              className="mx-auto mb-5 h-auto w-[260px]"
              height={65}
              priority
              src="/natralogowithkideco.png"
              width={260}
            />
            <div className="mx-auto mb-4 h-[3px] w-10 rounded-full bg-[var(--kideco-red-500)]" />
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-[#111827]">
              Masuk ke Control Center
            </h1>
            <p className="mt-2 text-sm text-[#9ca3af]">
              Akses terbatas untuk dispatcher resmi Kideco.
            </p>
          </div>

          {/* Form */}
          <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-[#374151]"
                htmlFor="employee-id"
              >
                ID Dispatcher
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                <Input
                  autoComplete="username"
                  className="h-11 pl-10"
                  id="employee-id"
                  onChange={(event) => setEmployeeId(event.target.value)}
                  placeholder="Contoh: DSP-001"
                  required
                  value={employeeId}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-[#374151]"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                <Input
                  autoComplete="current-password"
                  className="h-11 px-10"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#9ca3af] transition hover:bg-[#f9fafb] hover:text-[#374151]"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div
                className="rounded-lg border border-[var(--danger-100)] bg-[var(--danger-50)] px-3 py-2.5 text-sm text-[var(--danger-700)]"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <Button
              className="h-11 w-full bg-gradient-to-br from-[var(--kideco-red-500)] to-[var(--kideco-red-700)] shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-95"
              disabled={submitting}
              onClick={attemptLogin}
              type="button"
            >
              {submitting ? "Membuka dashboard..." : "Masuk sebagai Dispatcher"}
              <LogIn className="size-4" />
            </Button>
          </form>

          {/* Demo credentials — terminal card */}
          <div
            className="mt-5 overflow-hidden rounded-lg border border-[#e5e7eb]"
            style={{ boxShadow: "inset 3px 0 0 0 var(--kideco-red-400)" }}
          >
            <div className="border-b border-[#f3f4f6] bg-[#f9fafb] px-3 py-1.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-[#ef4444]" />
                  <div className="size-2.5 rounded-full bg-[#fbbf24]" />
                  <div className="size-2.5 rounded-full bg-[#22c55e]" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                  kredensial demo
                </span>
              </div>
            </div>
            <div className="bg-white px-3.5 py-2.5">
              <p className="font-mono text-xs text-[#6b7280]">
                <span className="select-none text-[#d1d5db]">id{"  "}</span>
                <span className="font-semibold text-[#111827]">{DEMO_DISPATCHER.employeeId}</span>
              </p>
              <p className="mt-1 font-mono text-xs text-[#6b7280]">
                <span className="select-none text-[#d1d5db]">pwd </span>
                <span className="font-semibold text-[#111827]">{DEMO_DISPATCHER.password}</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-[#d1d5db]">
            KIC 2026 · Hackathon Prototype · Kideco Jaya Agung
          </p>
        </div>
      </section>
    </main>
  );
}
