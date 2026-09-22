import { useState, useEffect } from "react";

export const SMTP_RENEWAL_PLANS = [
  {
    id: "3m",
    name: "Quarterly Scale",
    originalPrice: 6159.60,
    price: 5851.62,
    discount: "5% OFF",
    validity: "3 Months",
    credits: "75000",
    badgeColor: "bg-[#5B9B00]",
    notes: "Recommended for ongoing bulk campaigns (25k/mo)",
  },
  {
    id: "6m",
    name: "Half-Yearly Growth",
    originalPrice: 12319.20,
    price: 11087.28,
    discount: "10% OFF",
    validity: "6 Months",
    credits: "150000",
    badgeColor: "bg-[#5B9B00]",
    notes: "Save ₹1,231 with 6-month commitment",
  },
  {
    id: "12m",
    name: "Annual Enterprise",
    originalPrice: 24638.40,
    price: 20942.64,
    discount: "15% OFF",
    validity: "12 Months",
    credits: "300000",
    badgeColor: "bg-[#5B9B00]",
    notes: "Best value: Save ₹3,695 per year",
  },
  {
    id: "1m",
    name: "Starter Monthly",
    originalPrice: null,
    price: 2053.20,
    discount: "STANDARD",
    validity: "1 Month",
    credits: "25000",
    badgeColor: "bg-slate-600",
    notes: "Pay-as-you-go basic sending limit",
  },
];

export function SmtpRenewalModal({ isOpen, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0); // starts with 3 Months plan (matching screenshot)
      setOrderConfirmed(null);
    }
  }, [isOpen]);

  // Handle keyboard navigation (Escape, Left/Right arrows)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : SMTP_RENEWAL_PLANS.length - 1));
      }
      if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev < SMTP_RENEWAL_PLANS.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPlan = SMTP_RENEWAL_PLANS[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev < SMTP_RENEWAL_PLANS.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : SMTP_RENEWAL_PLANS.length - 1));
  };

  const handleGetNow = (plan) => {
    setOrderConfirmed({
      orderId: `SMTP-${Date.now().toString().slice(-6)}`,
      plan,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-[#625AF8] flex items-center justify-center font-bold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 font-display">
                SMTP Provider Renewal
              </h2>
              <p className="text-[11px] text-slate-400">
                Bulk email credits & server renewal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer text-base"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-slate-50/50">
          {orderConfirmed ? (
            /* Order Confirmation Step */
            <div className="text-center py-4 space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Renewal Order Initiated!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Your renewal request for <span className="font-semibold text-slate-700">{orderConfirmed.plan.credits} Email Credits</span> ({orderConfirmed.plan.validity}) has been confirmed.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-left text-xs space-y-2 max-w-xs mx-auto shadow-2xs">
                <div className="flex justify-between text-slate-500">
                  <span>Order Reference:</span>
                  <span className="font-mono font-bold text-slate-800">#{orderConfirmed.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Amount Payable:</span>
                  <span className="font-mono font-bold text-slate-900">₹{orderConfirmed.plan.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Billing Cycle:</span>
                  <span className="font-semibold text-slate-700">{orderConfirmed.plan.validity}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Email Account:</span>
                  <span className="font-semibold text-slate-700">marketing@tecnoprism.com</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob(
                      [
                        `SMTP RENEWAL INVOICE\nOrder ID: #${orderConfirmed.orderId}\nDate: ${orderConfirmed.date}\nPlan: ${orderConfirmed.plan.validity} (${orderConfirmed.plan.credits} Credits)\nAmount: INR ${orderConfirmed.plan.price.toFixed(2)}\nStatus: Approved`
                      ],
                      { type: "text/plain" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Invoice-${orderConfirmed.orderId}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-primary !py-2.5 !text-xs !font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Download Proforma Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setOrderConfirmed(null)}
                  className="btn !py-2 !text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Back to Plans
                </button>
              </div>
            </div>
          ) : (
            /* Card Carousel Display (Exact replica of user screenshot) */
            <div>
              <div className="text-center mb-4">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-[#625AF8] tracking-wide uppercase">
                  Active Renewal Offer
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Choose your credit bundle to recharge SMTP sending quotas
                </p>
              </div>

              <div className="relative flex items-center justify-center">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={handlePrev}
                  title="Previous Plan"
                  aria-label="Previous Plan"
                  className="absolute -left-2 z-10 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-slate-50 flex items-center justify-center font-bold text-sm cursor-pointer transition-transform active:scale-95"
                >
                  ‹
                </button>

                {/* The EXACT Card from user screenshot */}
                <div className="w-[310px] bg-white rounded-2xl border border-slate-200/90 shadow-lg p-5 transition-all duration-200">
                  {/* Top row: Strikethrough price + Discount badge */}
                  <div className="flex items-center justify-between min-h-[26px]">
                    <span className="text-slate-500 line-through text-sm font-medium tracking-tight font-mono">
                      {currentPlan.originalPrice != null
                        ? `₹${currentPlan.originalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                    {currentPlan.discount && (
                      <span className={`${currentPlan.badgeColor} text-white text-[11px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide`}>
                        {currentPlan.discount}
                      </span>
                    )}
                  </div>

                  {/* Main Price */}
                  <div className="mt-2 text-[32px] font-extrabold text-slate-900 tracking-tight font-sans">
                    ₹{currentPlan.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Hairline Divider */}
                  <div className="border-t border-slate-100 my-4" />

                  {/* Two Columns: Validity & Email Credits */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="text-slate-400 font-medium text-[11px]">Validity</div>
                      <div className="text-slate-800 font-bold text-sm mt-0.5">
                        {currentPlan.validity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 font-medium text-[11px]">Email Credits</div>
                      <div className="text-slate-800 font-bold text-sm mt-0.5 font-mono">
                        {currentPlan.credits}
                      </div>
                    </div>
                  </div>

                  {/* Center 'Get Now' Button */}
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleGetNow(currentPlan)}
                      className="bg-[#625AF8] hover:bg-[#5249E0] active:scale-95 text-white font-semibold text-sm px-9 py-2 rounded-full shadow-md transition-all cursor-pointer"
                    >
                      Get Now
                    </button>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  title="Next Plan"
                  aria-label="Next Plan"
                  className="absolute -right-2 z-10 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-slate-50 flex items-center justify-center font-bold text-sm cursor-pointer transition-transform active:scale-95"
                >
                  ›
                </button>
              </div>

              {/* Carousel Pagination Dots (Matching screenshot with pill active dot) */}
              <div className="flex items-center justify-center gap-1.5 mt-5">
                {SMTP_RENEWAL_PLANS.map((plan, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      aria-label={`Go to ${plan.validity} plan`}
                      onClick={() => setActiveIndex(index)}
                      className={`cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "w-6 h-1.5 bg-[#625AF8] rounded-full"
                          : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-3 text-center">
                <p className="text-[11px] text-slate-400 italic">
                  {currentPlan.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>SMTP Provider: Netcore / Pepipost API</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
