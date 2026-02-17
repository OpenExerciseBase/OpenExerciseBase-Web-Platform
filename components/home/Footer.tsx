import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-bg py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Open Exercise Database logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-base font-semibold text-gray-900 tracking-tight">
                Open Exercise Database
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 max-w-xs">
              An open and community driven repository of structured exercise
              data.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Links</h4>
            <ul className="mt-3 space-y-2.5">
              <li>
                <a
                  href="/explore"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Explore exercises
                </a>
              </li>
              <li>
                <a
                  href="/documentation"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/contribution-guidelines"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  How to contribute
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/rania-is/samplejson"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Citation */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Cite this dataset
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Citation information will be provided here.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-6 flex flex-col items-center gap-2">
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 1.5a10.5 10.5 0 1 1 0 21 10.5 10.5 0 0 1 0-21Zm-.5 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM9 9.5a.75.75 0 0 0 0 1.5h2.25v5H9a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-2.25v-5.75A.75.75 0 0 0 12 9.5H9Z" />
            </svg>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 1.5a10.5 10.5 0 1 1 0 21 10.5 10.5 0 0 1 0-21Zm-1.13 7.4c-2.42 0-3.87 1.7-3.87 4.1s1.45 4.1 3.87 4.1c1.8 0 3.05-1.02 3.5-2.55l-1.73-.66c-.25.85-.88 1.5-1.77 1.5-1.18 0-1.93-1-1.93-2.39s.75-2.39 1.93-2.39c.89 0 1.48.6 1.73 1.44l1.73-.7c-.45-1.47-1.7-2.45-3.46-2.45Z" />
            </svg>
          </a>
          <p className="text-xs text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Open Exercise Database. Licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 transition-colors"
            >
              Creative Commons Attribution 4.0 International (CC BY 4.0)
            </a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
