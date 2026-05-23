import Link from "next/link";

export const metadata = { title: "Terms · Nouri" };

export default function TermsPage() {
  const updated = "May 2026";
  return (
    <article className="prose-calm flex flex-col gap-5 pt-2 text-ink">
      <header>
        <h1 className="text-2xl font-medium">Terms</h1>
        <p className="mt-1 text-sm text-muted">Last updated {updated}</p>
      </header>

      <p>
        By using Nouri you agree to the following. We've kept this short and plain because the
        product itself is supposed to be calmer than the average nutrition app.
      </p>

      <h2 className="text-lg font-medium">Not medical advice</h2>
      <p>
        Calorie estimates are guesses, not measurements. Nouri is not a medical device. If you
        have an eating disorder, are pregnant, are managing a chronic condition, or otherwise
        need clinical nutrition guidance, talk to a doctor or registered dietitian.
      </p>

      <h2 className="text-lg font-medium">Honest about uncertainty</h2>
      <p>
        Every AI estimate ships with a confidence score because the model can be wrong. Treat the
        numbers as approximations and correct them when you know better.
      </p>

      <h2 className="text-lg font-medium">Your content</h2>
      <p>
        You own the meals, photos, and weights you log. Granting Nouri permission to display and
        process them only goes as far as making the app work for you.
      </p>

      <h2 className="text-lg font-medium">Acceptable use</h2>
      <p>
        Don't upload other people's photos without their consent, illegal material, or anything
        designed to mislead the model. We may remove content and revoke access for clear abuse.
      </p>

      <h2 className="text-lg font-medium">No warranty</h2>
      <p>
        Nouri is provided as-is. We do our best to keep it running and accurate but we don't
        promise uptime, perfect estimates, or fitness for any particular purpose.
      </p>

      <h2 className="text-lg font-medium">Changes</h2>
      <p>
        We may update these terms. If we make a change that materially affects you we'll bump the
        "last updated" date and surface a note in the app.
      </p>

      <h2 className="text-lg font-medium">Contact</h2>
      <p>
        Email <a href="mailto:hello@nouri.app" className="underline">hello@nouri.app</a>.
      </p>

      <p className="pt-4 text-sm text-muted">
        <Link href="/privacy" className="underline">Privacy</Link>
        {" · "}
        <Link href="/settings" className="underline">Back to settings</Link>
      </p>
    </article>
  );
}
