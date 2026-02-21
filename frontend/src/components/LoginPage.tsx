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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectPath = (location.state as RedirectState | null)?.from || "/";
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
    <main className="app-shell">
      <section className="login-shell card">
        <p className="kicker">Phase 5 Auth</p>
        <h1>Login</h1>
        <p className="muted">
          Sign in to continue. Access token stays in memory and refresh token is set via secure httpOnly cookie.
        </p>

        <form className="login-form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="estimate-btn" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="muted small">
          No account yet? Signup page is next in Phase 5. Continue using route search while this flow is being built.
        </p>
        <Link to="/" className="top-nav-link login-back-link">
          Back to Route Finder
        </Link>
      </section>
    </main>
  );
}
