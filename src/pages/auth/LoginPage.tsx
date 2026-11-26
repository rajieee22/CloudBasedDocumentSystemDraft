import { useState, type FormEvent } from "react";
import { Button, Icon, Logo } from "../../components/ui";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your university email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-story">
        <div className="story-overlay" />
        <div className="story-content">
          <Logo light />

          <div className="story-copy">
            <span className="eyebrow light">
              A better way to move documents forward
            </span>

            <h1>Approvals, made simpler.</h1>

            <p>
              Submit university documents, follow every approval, and keep your
              academic requests moving—wherever you are.
            </p>

            <div className="trust-row">
              <span>
                <Icon name="check" size={16} /> Transparent tracking
              </span>
              <span>
                <Icon name="check" size={16} /> Secure e-signatures
              </span>
            </div>
          </div>

          <small className="copyright">
            © 2026 Mindanao State University – Iligan Institute of Technology
          </small>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-box">
          <div className="mobile-logo">
            <Logo />
          </div>

          <span className="eyebrow">Welcome to Document Services</span>
          <h2>Sign in to your account</h2>

          <p className="muted">
            Use your official MSU-IIT university credentials.
          </p>

          <form onSubmit={submit}>
            <label htmlFor="login-email">University email</label>

            <div className={`field-icon ${error ? "field-error" : ""}`}>
              <Icon name="mail" size={18} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="name@g.msuiit.edu.ph"
                autoComplete="username"
                required
              />
            </div>

            <div className="label-row">
              <label htmlFor="login-password">Password</label>
            </div>

            <div className="field-icon">
              <Icon name="user" size={18} />
              <input
                id="login-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="show-pass"
                onClick={() => setShow((value) => !value)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                <Icon name="eye" size={18} />
              </button>
            </div>

            {error && (
              <div className="error-text" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="full">
              {submitting ? "Signing in..." : "Sign in"}
              <Icon name="arrow" size={17} />
            </Button>
          </form>

          <p className="privacy">
            By signing in, you agree to the university's acceptable use and data
            privacy policies.
          </p>
        </div>
      </section>
    </div>
  );
}
