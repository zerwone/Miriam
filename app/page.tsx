import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-miriam-bg to-miriam-bgSoft">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-miriam-bg/90 backdrop-blur-sm border-b border-miriam-bgSoft/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-miriam-icon.svg"
                alt="Miriam Lab"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="font-heading text-xl font-bold text-miriam-text">
                Miriam Lab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-miriam-text/80 hover:text-miriam-text transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/app"
                className="btn-primary"
              >
                Open Lab
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <Image
                src="/logo-miriam-full.svg"
                alt="Miriam Lab"
                width={300}
                height={60}
                className="w-auto h-16"
                priority
              />
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-miriam-text mb-6">
              One prompt.
              <br />
              <span className="bg-gradient-to-r from-miriam-purple to-miriam-blue bg-clip-text text-transparent">
                Many minds.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-xl sm:text-2xl text-miriam-text/80 max-w-3xl mx-auto mb-12 leading-relaxed">
              Miriam Lab is a multi-model AI playground where you can chat, compare, judge, and research with multiple AI models side-by-side.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/app"
                className="btn-primary text-lg px-8 py-4"
              >
                Open Miriam Lab
              </Link>
              <Link
                href="/pricing"
                className="btn-secondary text-lg px-8 py-4"
              >
                View Pricing
              </Link>
            </div>
          </div>

          {/* Feature Preview */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-miriam-bgSoft/50 border border-miriam-gray/20 rounded-lg p-6">
              <div className="text-miriam-purple text-2xl font-bold mb-2">Miriam</div>
              <p className="text-miriam-text/70">Chat with a single AI model</p>
            </div>
            <div className="bg-miriam-bgSoft/50 border border-miriam-gray/20 rounded-lg p-6">
              <div className="text-miriam-blue text-2xl font-bold mb-2">Compare</div>
              <p className="text-miriam-text/70">Compare multiple models side-by-side</p>
            </div>
            <div className="bg-miriam-bgSoft/50 border border-miriam-gray/20 rounded-lg p-6">
              <div className="text-miriam-green text-2xl font-bold mb-2">Judge</div>
              <p className="text-miriam-text/70">Let AI rank and critique responses</p>
            </div>
            <div className="bg-miriam-bgSoft/50 border border-miriam-gray/20 rounded-lg p-6">
              <div className="text-miriam-purple text-2xl font-bold mb-2">Research</div>
              <p className="text-miriam-text/70">Multi-expert research panel</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
