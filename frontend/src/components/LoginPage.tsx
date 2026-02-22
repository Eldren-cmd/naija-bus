import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { loginUser } from "../lib/api";

type RedirectState = {
  from?: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, applyLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commuterHighlights = [
    "Submit fare reports in seconds",
    "Save your daily routes for quick access",
    "Record trips and build your commuter score",
  ];

  const redirectPath = (location.state as RedirectState | null)?.from || "/map";
  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });
      applyLogin(response);
      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark" aria-hidden="true">
            NT
          </span>
          <span>Naija Transport</span>
        </Link>
        <Link to="/signup" className="auth-head-link">
          Create account
        </Link>
      </header>

      <main className="auth-main">
        <div className="auth-card-wrap">
          <section className="auth-card">
            <div className="auth-card-head">
              <span className="auth-icon-chip" aria-hidden="true">
                NT
              </span>
              <h1>Welcome back</h1>
              <p>Sign in to report fares and track your trips.</p>
            </div>

            <ul className="auth-benefits" aria-label="Account benefits">
              {commuterHighlights.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <strong>Login failed.</strong>
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={onSubmit}>
              <label className="auth-field">
                <span>Email address</span>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    @
                  </span>
                  <input
                    className="auth-input"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <div className="auth-field-top">
                <span>Password</span>
                <span className="auth-help-copy">Password reset coming soon</span>
              </div>
              <label className="auth-field auth-field-password">
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    *
                  </span>
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? (
                  <span className="auth-submit-state">
                    <span className="auth-spinner" aria-hidden="true" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="auth-inline-copy">
              No account yet?{" "}
              <Link to="/signup" className="auth-link">
                Create one free
              </Link>
            </p>
          </section>

          <p className="auth-trust-line">Your data is secure. We never share personal info with third parties.</p>
        </div>
      </main>
    </div>
  );
}
