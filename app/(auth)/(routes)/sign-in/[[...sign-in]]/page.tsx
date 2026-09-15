"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/auth/login", { email, password });
      // Hard navigation is more reliable than soft RSC routing on mobile networks.
      const redirectTo = new URLSearchParams(window.location.search).get("redirect_url") || "/";
      window.location.assign(redirectTo);
    } catch (err: any) {
      setError(err?.response?.data?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-800">雨林外贸实战课程</h1>
      <p className="mt-1 text-sm text-slate-500">使用学员账号登录后学习课程</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">邮箱</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="请输入邮箱" required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">密码</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="请输入密码" required />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        没有账号？请联系管理员开通。
        <Link className="ml-1 text-sky-700 underline" href="/sign-up">自助注册</Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
