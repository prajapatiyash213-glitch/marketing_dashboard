import { useState, useEffect } from "react";

export const DIRECT_SMTP_PLAN = {
  originalPrice: 6159.60,
  price: 5851.62,
  discount: "5% OFF",
  validity: "3 Months",
  credits: "75000",
  monthlyEquivalent: 1950.54,
  savings: 307.98,
};

/**
 * Exact Direct Renewal Card from the user's reference image
 */
export function SmtpDirectRenewalCard({ onGetNow, className = "" }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* The EXACT Card matching user screenshot */}
      <div className="w-[310px] bg-white rounded-2xl border border-slate-200/90 shadow-lg p-5 select-none transition-all duration-200 hover:shadow-xl">
        {/* Top row: Strikethrough price + 5% OFF badge */}
        <div className="flex items-center justify-between min-h-[26px]">
          <span className="text-slate-500 line-through text-sm font-medium tracking-tight font-mono">
            ₹{DIRECT_SMTP_PLAN.originalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="bg-[#5B9B00] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide">
            {DIRECT_SMTP_PLAN.discount}
          </span>
        </div>

        {/* Main Big Price */}
        <div className="mt-2 text-[32px] font-extrabold text-slate-900 tracking-tight font-sans">
          ₹{DIRECT_SMTP_PLAN.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Hairline Divider */}
        <div className="border-t border-slate-100 my-4" />

        {/* Two Columns: Validity & Email Credits */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-400 font-medium text-[11px]">Validity</div>
            <div className="text-slate-800 font-bold text-sm mt-0.5">
              {DIRECT_SMTP_PLAN.validity}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 font-medium text-[11px]">Email Credits</div>
            <div className="text-slate-800 font-bold text-sm mt-0.5 font-mono">
              {DIRECT_SMTP_PLAN.credits}
            </div>
          </div>
        </div>

        {/* Center 'Get Now' Button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onGetNow}
            className="bg-[#625AF8] hover:bg-[#5249E0] active:scale-95 text-white font-semibold text-sm px-9 py-2 rounded-full shadow-md transition-all cursor-pointer"
          >
            Get Now
          </button>
        </div>
      </div>

      {/* Carousel Dots indicator matching screenshot [==]  o  o  o */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        <span className="w-6 h-1.5 bg-[#625AF8] rounded-full" />
        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Direct Renewal Modal Popup for 3 Months: 75,000 Credits at ₹5,851.62
 */
export function SmtpRenewalModal({ isOpen, onClose }) {
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setOrderConfirmed(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGetNow = () => {
    setOrderConfirmed({
      orderId: `SMTP-${Date.now().toString().slice(-6)}`,
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
        {/* Modal Header */}
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
                Direct renewal for 75,000 email credits
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

        {/* Modal Content */}
        <div className="p-6 bg-slate-50/50">
          {orderConfirmed ? (
            /* Order Confirmed Screen */
            <div className="text-center py-4 space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Renewal Order Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Your renewal for <span className="font-semibold text-slate-700">75,000 Email Credits (3 Months)</span> has been approved.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-left text-xs space-y-2 max-w-xs mx-auto shadow-2xs">
                <div className="flex justify-between text-slate-500">
                  <span>Order Reference:</span>
                  <span className="font-mono font-bold text-slate-800">#{orderConfirmed.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Amount (5% OFF):</span>
                  <span className="font-mono font-bold text-slate-900">₹5,851.62</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Validity:</span>
                  <span className="font-semibold text-slate-700">3 Months</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Email Credits:</span>
                  <span className="font-semibold text-slate-700">75,000</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Account:</span>
                  <span className="font-semibold text-slate-700">marketing@tecnoprism.com</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob(
                      [
                        `SMTP PROVIDER RENEWAL INVOICE\nOrder ID: #${orderConfirmed.orderId}\nDate: ${orderConfirmed.date}\nValidity: 3 Months\nEmail Credits: 75,000\nOriginal Price: INR 6,159.60\nDiscount: 5% OFF (Saved INR 307.98)\nTotal Payable: INR 5,851.62\nAccount: marketing@tecnoprism.com\nStatus: Approved & Active`
                      ],
                      { type: "text/plain" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `SMTP-Renewal-Invoice-${orderConfirmed.orderId}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-primary !py-2.5 !text-xs !font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Download Proforma Invoice
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn !py-2 !text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Direct Card Display matching user screenshot */
            <div className="py-2">
              <div className="text-center mb-4">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5B9B00] text-white tracking-wide uppercase">
                  5% OFF Special Renewal
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  75,000 Email Credits with 3 Months Validity
                </p>
              </div>

              <SmtpDirectRenewalCard onGetNow={handleGetNow} />

              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-400">
                  Direct top-up for active bulk email marketing campaigns
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Provider: Netcore / Pepipost API</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
