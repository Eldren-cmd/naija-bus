import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { registerUser } from "../lib/api";

export function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, applyLogin } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commuterHighlights = [
    "Earn credibility with verified reports",
    "Access saved routes across devices",
    "Help make Lagos fares more transparent",
  ];

  if (isAuthenticated) {
    return <Navigate to="/map" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Full name, email, and password are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      applyLogin(response);
      navigate("/map", { replace: true });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Signup failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrengthLabel =
    password.length < 8 ? "Too short" : password.length < 12 ? "Good" : "Strong";
  const passwordMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark" aria-hidden="true">
            NT
          </span>
          <span>Naija Transport</span>
        </Link>
        <Link to="/login" className="auth-head-link">
          Sign in
        </Link>
      </header>

      <main className="auth-main">
        <div className="auth-card-wrap">
          <section className="auth-card">
            <div className="auth-card-head">
              <span className="auth-icon-chip" aria-hidden="true">
                NT
              </span>
              <h1>Join Naija Transport</h1>
              <p>Help fellow commuters by reporting fares on your route.</p>
            </div>

            <ul className="auth-benefits" aria-label="Why create an account">
              {commuterHighlights.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <strong>Signup failed.</strong>
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={onSubmit}>
              <label className="auth-field">
                <span>Full name</span>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    U
                  </span>
                  <input
                    className="auth-input"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Gabriel Adenrele"
                  />
                </div>
              </label>

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

              <label className="auth-field auth-field-password">
                <span>Password</span>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    *
                  </span>
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="password-strength">
                    <span className={password.length >= 8 ? "is-strong" : ""} />
                    <span className={password.length >= 12 ? "is-strong" : ""} />
                    <span className={password.length >= 16 ? "is-strong" : ""} />
                    <small>{passwordStrengthLabel}</small>
                  </div>
                )}
              </label>

              <label className="auth-field">
                <span>Confirm password</span>
                <div className={`auth-input-wrap ${confirmPassword ? (passwordMatch ? "match" : "mismatch") : ""}`}>
                  <span className="auth-input-icon" aria-hidden="true">
                    *
                  </span>
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat password"
                  />
                  {confirmPassword && (
                    <span className={`auth-match-pill ${passwordMatch ? "ok" : "bad"}`}>
                      {passwordMatch ? "OK" : "X"}
                    </span>
                  )}
                </div>
              </label>

              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? (
                  <span className="auth-submit-state">
                    <span className="auth-spinner" aria-hidden="true" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account - It's Free"
                )}
              </button>
            </form>

            <p className="auth-inline-copy">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </section>

          <p className="auth-trust-line">By signing up you help fellow Lagos commuters.</p>
        </div>
      </main>
    </div>
  );
}
