"use client";
import { useState } from "react";
import { Building2, ArrowRight, ShieldCheck } from "lucide-react";
export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="login">
      <section className="login-brand">
        <div className="brand">
          <span className="brand-icon">
            <Building2 />
          </span>
          NestLedger
        </div>
        <div>
          <span className="eyebrow">YOUR PG, IN GOOD HANDS</span>
          <h1>
            A little less admin.
            <br />A lot more clarity.
          </h1>
          <p>
            One workspace for your properties, residents,
            <br />
            and everything that keeps them running.
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
        <small>Built for the way you manage your PG.</small>
      </section>
      <section className="login-form">
        <div className="login-card">
          <span className="secure">
            <ShieldCheck size={17} /> OWNER & STAFF ACCESS
          </span>
          <h2>Welcome back.</h2>
          <p>Sign in to your owner workspace.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const f = new FormData(e.currentTarget);
                const r = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(Object.fromEntries(f)),
                });
                const result = await r.json();
                if (!r.ok) throw Error(result.error);
                location.reload();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
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
