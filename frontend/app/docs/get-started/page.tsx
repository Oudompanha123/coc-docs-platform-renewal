import Link from "next/link";
import { DocStep } from "@/components/docs/DocStep";
import { DocsCallout } from "@/components/docs/DocsCallout";

export default function GetStartedPage() {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">Get started</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">Up and running in four steps.</h1>
      <p className="mt-3 text-base text-muted">
        No install, no setup script — <strong>Coc Docs Platform</strong> runs entirely in your browser.
      </p>

      <div className="mt-8">
        <DocStep number={1} title="Create your account">
          <p>
            Go to{" "}
            <Link href="/register" className="font-semibold text-foreground hover:underline">
              Sign up
            </Link>{" "}
            and create an account with your email, or continue with Google.
          </p>
        </DocStep>

        <DocStep number={2} title="Sign in">
          <p>
            Use{" "}
            <Link href="/login" className="font-semibold text-foreground hover:underline">
              Log in
            </Link>{" "}
            with the same email/password or Google account you signed up with.
          </p>
          <DocsCallout>
            New accounts are reviewed by a <strong>Super Admin</strong> before they get full access — this keeps every
            workspace <strong>invite-only</strong> under the hood, even for self-service sign-ups.
          </DocsCallout>
        </DocStep>

        <DocStep number={3} title="Open your first workspace">
          <p>
            From <strong>Overview</strong>, create or join a <strong>Workspace</strong> to keep one team or project&apos;s documents
            together, separate from everyone else&apos;s.
          </p>
        </DocStep>

        <DocStep number={4} title="Publish your first page">
          <p>
            Open <strong>Doc Studio</strong>, write your page, and publish it. There&apos;s no code deploy involved —
            changes go live as soon as you publish.
          </p>
        </DocStep>
      </div>
    </div>
  );
}
