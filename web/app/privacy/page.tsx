import Link from "next/link";

export const metadata = { title: "Privacy · Nouri" };

export default function PrivacyPage() {
  const updated = "May 2026";
  return (
    <article className="prose-calm flex flex-col gap-5 pt-2 text-ink">
      <header>
        <h1 className="text-2xl font-medium">Privacy</h1>
        <p className="mt-1 text-sm text-muted">Last updated {updated}</p>
      </header>

      <p>
        Nouri is built around one principle: <strong>permission to track imperfectly</strong>. That
        applies to your data, too. We collect as little as possible and we tell you everything we
        do with it.
      </p>

      <h2 className="text-lg font-medium">What we collect</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <strong>A device ID.</strong> A random UUID generated in your browser the first time you
          open Nouri. There's no account or email until you choose to add one.
        </li>
        <li>
          <strong>Profile basics</strong> (optional): age, weight, height, goal — only what you
          type into onboarding or Settings.
        </li>
        <li>
          <strong>Logged meals</strong>: labels, calories, macros, and any photos you take to log
          a meal. Photos live on our server until you delete the meal.
        </li>
        <li>
          <strong>Weight history</strong>: entries you log in Settings.
        </li>
      </ul>

      <h2 className="text-lg font-medium">Who sees your data</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <strong>Anthropic.</strong> Photos you snap are sent to Anthropic's Claude vision API for
          analysis. Anthropic does not train on API data by default. See{" "}
          <a
            href="https://www.anthropic.com/legal/privacy"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Anthropic's privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Open Food Facts.</strong> When you scan a barcode, the barcode number is sent to
          their public API. No personal data goes with it.
        </li>
        <li>
          <strong>Railway.</strong> Our hosting provider. They store the database and photos.
        </li>
      </ul>

      <h2 className="text-lg font-medium">What we don't do</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>We don't sell your data.</li>
        <li>We don't share it with advertisers.</li>
        <li>We don't use your photos to train models.</li>
        <li>We don't track you across the web.</li>
      </ul>

      <h2 className="text-lg font-medium">Your rights</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>Delete any meal anytime from the Quick Correct screen — its photo is removed with it.</li>
        <li>Email a request to delete everything for your device ID and we'll wipe it within 30 days.</li>
      </ul>

      <h2 className="text-lg font-medium">Contact</h2>
      <p>
        Questions? Email <a href="mailto:hello@nouri.app" className="underline">hello@nouri.app</a>.
      </p>

      <p className="pt-4 text-sm text-muted">
        <Link href="/terms" className="underline">Terms of Service</Link>
        {" · "}
        <Link href="/settings" className="underline">Back to settings</Link>
      </p>
    </article>
  );
}
