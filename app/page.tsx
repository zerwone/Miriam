import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to Miriam Lab
        </h1>
        <p className="text-center mb-8 text-lg">
          An AI playground for comparing, judging, and researching with multiple models
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/app"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
