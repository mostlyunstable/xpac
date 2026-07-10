import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="relative mb-xl">
        <div className="w-32 h-32 rounded-full bg-surface-container-low flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant">explore_off</span>
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-xl text-white">question_mark</span>
        </div>
      </div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-md">Page Not Found</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-xl max-w-md">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <Link
        to="/dashboard"
        className="px-xl py-3 font-body-md text-body-md bg-primary text-white rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Dashboard
      </Link>
    </div>
  );
}