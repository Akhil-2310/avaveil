import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-sm font-medium text-red-400">Avalanche Fuji Testnet</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
            Privacy-Preserving<br />
            <span className="text-red-500">Rewards.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Create campaigns and distribute rewards using{" "}
            <span className="text-white font-medium">encrypted token balances</span> and
            zero-knowledge{" "}
            <span className="text-white font-medium">identity proofs</span>.
            No exposed wallets, no leaked KYC.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/campaigns"
              className="px-8 py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
            >
              Explore Campaigns
            </Link>
            <Link
              href="/campaigns/create"
              className="px-8 py-4 rounded-xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              Create Campaign
            </Link>
            <Link
              href="/tokens"
              className="px-8 py-4 rounded-xl font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              Get Tokens
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
            Token-gated rewards powered by encrypted tokens and zero-knowledge proofs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔐",
                title: "Zero-Knowledge KYC",
                desc: "Users prove identity with Self Protocol. Age, nationality, and gender are verified without exposing personal data on-chain.",
              },
              {
                icon: "🥷",
                title: "Encrypted Balances",
                desc: "eERC token balances are ElGamal-encrypted on-chain. Only you can decrypt your own balance — nobody else can see it.",
              },
              {
                icon: "⚡",
                title: "Token-Gated Claims",
                desc: "Campaign creators set criteria. Users prove eligibility privately. Rewards flow to qualified wallets without revealing who qualifies.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-red-600/20 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-gray-500 mb-8">
            Deploy your first privacy-preserving campaign in minutes.
          </p>
          <Link
            href="/campaigns/create"
            className="inline-block px-8 py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
          >
            Create Campaign &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
