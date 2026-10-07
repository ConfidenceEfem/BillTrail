import { motion } from "framer-motion";

export function AuthSidePanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-accent-blue via-brand-600 to-brand-900 items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-10 w-[28rem] h-[28rem] rounded-full bg-accent-lilac/20 blur-3xl"
      />

      <div className="relative z-10 max-w-sm px-10 text-white">
        <p className="text-2xl font-semibold mb-4">Get paid, without the chasing.</p>
        <p className="text-white/80 text-sm mb-8">
          Send a professional invoice, share one link, and watch your dashboard update the moment
          your client pays.
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <p className="text-xs text-white/60 mb-1">Outstanding</p>
          <p className="text-3xl font-semibold mb-4">NGN 322,500</p>
          <div className="flex justify-between text-xs text-white/70">
            <span>INV-0002 &middot; Acme Ltd</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full">Sent</span>
          </div>
        </div>
      </div>
    </div>
  );
}