"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setError(null);
    setLoading(true);

    const { error } = await resetPassword(values.email);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main className="space-y-10">
        <div className="space-y-2">
          <p className="type-meta">Authentication</p>
          <h1 className="type-h1">Check Your Email</h1>
          <p className="type-lead">
            We&apos;ve sent you a password reset link. Please check your email.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm max-w-md">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-900 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-10">
      <div className="space-y-2">
        <p className="type-meta">Authentication</p>
        <h1 className="type-h1">Reset Password</h1>
        <p className="type-lead">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              {...register("email")}
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/auth/login"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Back to sign in
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
