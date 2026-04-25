import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { api, setAdminToken } from "@/lib/api";
import { toast } from "sonner";

export default function AdminLogin() {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await api.adminLogin(pw);
      setAdminToken(token);
      nav("/admin");
    } catch (err: any) {
      toast.error(err.message ?? "Login failed");
    } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-maroon-dp flex items-center justify-center p-6">
      <form onSubmit={submit} className="bg-ivory rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-maroon text-gold flex items-center justify-center mx-auto"><Lock size={20} /></div>
        <h1 className="font-display text-2xl text-maroon-dp text-center mt-4">Admin Sign-In</h1>
        <p className="text-xs text-muted-foreground text-center mt-1">Enter your admin password</p>
        <input
          type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="w-full mt-6 bg-cream-warm border border-maroon/20 rounded-lg px-3 py-3 text-sm outline-none focus:border-maroon"
        />
        <button disabled={loading} className="w-full mt-4 bg-maroon hover:bg-maroon-dk disabled:opacity-50 text-gold py-3 rounded-lg text-xs uppercase tracking-[0.16em] font-semibold">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
