"use client";
import { useState } from "react";
import { Building2, ArrowRight, ShieldCheck, Sparkles, KeyRound } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError("");
  };

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setBusy(true);
    setError("");
    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      location.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <section className="login-brand">
        <div className="brand">
          <span className="brand-icon">
            <Building2 size={24} />
          </span>
          NestLedger<span className="brand-dot">.</span>
        </div>
        <div>
          <span className="eyebrow">YOUR PG, IN GOOD HANDS</span>
          <h1>
            A little less admin.
            <br />A lot more clarity.
          </h1>
          <p>
            One modern workspace for your properties, residents,
            <br />
            and everything that keeps them running smoothly.
          </p>
          <div className="login-stats">
            <div>
              <b>Properties</b>
              <span>Every bed accounted for</span>
            </div>
            <div>
              <b>People</b>
              <span>Every resident connected</span>
            </div>
            <div>
              <b>Payments</b>
              <span>Every rupee recorded</span>
            </div>
          </div>
        </div>
        <small className="login-footnote">
          <Sparkles size={14} /> Built for modern PG & co-living operations.
        </small>
      </section>

      <section className="login-form">
        <div className="login-card">
          <span className="secure">
            <ShieldCheck size={17} /> OWNER & STAFF ACCESS
          </span>
          <h2>Welcome back.</h2>
          <p>Sign in to your owner workspace.</p>

          <div className="demo-credentials-box">
            <div className="demo-credentials-title">
              <KeyRound size={14} />
              <span>Quick Demo Access</span>
            </div>
            <div className="demo-buttons-row">
              <button
                type="button"
                className="demo-pill"
                onClick={() => {
                  fillDemo("admin@admin.com", "test1234");
                  handleLogin("admin@admin.com", "test1234");
                }}
                disabled={busy}
              >
                <span>👑 Owner Demo</span>
                <small>admin@admin.com</small>
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </label>
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              <ArrowRight size={18} />
            </button>
          </form>
          <small>
            Need access? Ask your property owner to create your account.
          </small>
        </div>
      </section>
    </main>
  );
}
