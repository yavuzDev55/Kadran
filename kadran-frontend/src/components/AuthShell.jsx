import { Link } from "react-router-dom";

export default function AuthShell({ title, lead, alternateLabel, alternateTo, alternateAction, children }) {
  return (
    <div className="auth-page px-4 py-6 sm:px-6 sm:py-10">
      <div className="auth-shell mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-border/20 bg-surface lg:grid-cols-[1fr_0.95fr]">
        <aside className="auth-art relative hidden min-h-[620px] overflow-hidden border-r border-border/20 p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="font-title text-2xl text-ink">
            Kadran
          </Link>
          <div className="auth-art__calendar" aria-hidden="true">
            <div className="auth-art__topline" />
            <div className="auth-art__grid">
              {Array.from({ length: 28 }, (_, index) => (
                <span key={index} className={index === 9 || index === 18 || index === 23 ? "is-marked" : ""} />
              ))}
            </div>
            <span className="auth-art__note">Make room for what matters.</span>
          </div>
          <p className="max-w-xs text-sm leading-6 text-muted">
            A calmer place to keep courses, deadlines and the rest of your week in view.
          </p>
        </aside>

        <section className="auth-form flex min-w-0 flex-col justify-center p-6 sm:p-10 lg:px-14">
          <Link to="/" className="mb-9 inline-flex w-fit font-title text-2xl text-ink lg:hidden">
            Kadran
          </Link>
          <h1 className="font-title text-3xl font-normal leading-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{lead}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-7 border-t border-border/15 pt-5 text-sm text-muted">
            {alternateLabel}{" "}
            <Link to={alternateTo} className="font-semibold text-link underline-offset-4 hover:underline">
              {alternateAction}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
