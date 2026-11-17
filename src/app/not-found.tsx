import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="page-shell">
      <p className="eyebrow">404 / LOST IN THE CUT</p>
      <h1>This scene is missing.</h1>
      <Link className="button violet" href="/">
        Back to the feeling ↗
      </Link>
    </main>
  );
}
