"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/auth/register", { name, email, password });
      await axios.post("/api/auth/login", { email, password });
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">注册学员账号</h1>
        <p className="mt-1 text-sm text-slate-500">注册后仍需管理员开通课程权限才能看课</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="姓名（可选）" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="w-full rounded-md border px-3 py-2 text-sm" type="email" placeholder="邮箱" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input className="w-full rounded-md border px-3 py-2 text-sm" type="password" placeholder="密码（至少8位）" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={8} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
            {loading ? "提交中..." : "注册"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          已有账号？
          <Link className="ml-1 text-sky-700 underline" href="/sign-in">去登录</Link>
        </p>
      </div>
    </div>
  );
}
