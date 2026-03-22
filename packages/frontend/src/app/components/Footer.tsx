import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-lg font-extrabold text-white tracking-tight">
              Ava<span className="text-red-500">Veil</span>
            </span>
            <p className="mt-3 text-sm text-gray-500 max-w-xs leading-relaxed">
              Privacy-preserving rewards protocol. Encrypted balances meet
              zero-knowledge identity proofs.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
              Protocol
            </h4>
            <div className="space-y-2 text-sm text-gray-500">
              <Link href="/campaigns" className="block hover:text-white transition-colors">
                Campaigns
              </Link>
              <Link href="/campaigns/create" className="block hover:text-white transition-colors">
                Create Campaign
              </Link>
              <Link href="/tokens" className="block hover:text-white transition-colors">
                Get Tokens
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
              Built With
            </h4>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Avalanche Fuji</p>
              <p>EncryptedERC (eERC)</p>
              <p>Self Protocol</p>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} AvaVeil. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
