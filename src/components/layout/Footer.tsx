import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-900 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                FC
              </div>
              <span className="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white">
                FREE CASH
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              The premier paid-action marketplace connecting businesses with real users for app testing, surveys, microtasks, and research.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              For Earners
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li><Link href="#tasks" className="hover:text-primary-600 transition-colors">Browse Tasks</Link></li>
              <li><Link href="#how-it-works" className="hover:text-primary-600 transition-colors">How to Earn</Link></li>
              <li><Link href="/register" className="hover:text-primary-600 transition-colors">Create Account</Link></li>
              <li><Link href="#referral" className="hover:text-primary-600 transition-colors">Referral Program</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              For Advertisers
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li><Link href="#advertisers" className="hover:text-primary-600 transition-colors">Post a Task</Link></li>
              <li><Link href="#pricing" className="hover:text-primary-600 transition-colors">Pricing & Budgeting</Link></li>
              <li><Link href="#verification" className="hover:text-primary-600 transition-colors">Automated Verification</Link></li>
              <li><Link href="#enterprise" className="hover:text-primary-600 transition-colors">Enterprise Solutions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li><Link href="/terms" className="hover:text-primary-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/security" className="hover:text-primary-600 transition-colors">Anti-Fraud Guarantee</Link></li>
              <li><Link href="/support" className="hover:text-primary-600 transition-colors">Help Center</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} FREE CASH. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Designed for Trust, Transparency & Speed.</p>
        </div>
      </div>
    </footer>
  );
}
