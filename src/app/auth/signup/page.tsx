"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

const signupSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setError(null);
    setLoading(true);

    const { error } = await signUp({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
    });

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
            We&apos;ve sent you a confirmation link. Please check your email to
            complete your registration.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm max-w-md">
          <p className="text-sm text-slate-600">
            Didn&apos;t receive the email?{" "}
            <button
              onClick={() => setSuccess(false)}
              className="font-medium text-slate-900 hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-10">
      <div className="space-y-2">
        <p className="type-meta">Authentication</p>
        <h1 className="type-h1">Create Account</h1>
        <p className="type-lead">Sign up to get started.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              {...register("fullName")}
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.fullName.message}
              </p>
            )}
          </div>

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

          <div>
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
