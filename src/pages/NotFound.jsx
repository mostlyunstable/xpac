import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <span className="material-symbols-outlined text-8xl text-outline-variant mb-lg">explore_off</span>
      <h1 className="font-display text-display text-on-surface mb-md">404</h1>
      <p className="font-headline-md text-headline-md text-on-surface mb-2">Page Not Found</p>
      <p className="font-body-md text-body-md text-on-surface-variant mb-xl max-w-md">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <Link
        to="/dashboard"
        className="px-xl py-2.5 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Dashboard
      </Link>
    </div>
  );
}