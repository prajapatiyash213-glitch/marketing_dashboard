import { useState, useEffect, useMemo } from "react";
import { USD_TO_INR } from "../state/useDashboard.js";

export const RENEWAL_PLANS = [
  {
    id: "smtp",
    tool: "SMTP Provider",
    provider: "Netcore / Pepipost SMTP API",
    badge: "5% OFF Special Renewal",
    title: "SMTP Provider — Direct Renewal Card",
    description: "Direct renewal card for bulk email marketing server. Re-charges 75,000 email credits with 3 Months validity at ₹5,851.62 (5% OFF from standard ₹6,159.60).",
    originalPrice: 6159.60,
    price: 5851.62,
    discount: "5% OFF",
    savings: 307.98,
    monthlyEquivalent: 1950.54,
    validity: "3 Months",
    metricLabel: "Email Credits",
    metricValue: "75000",
    account: "marketing@tecnoprism.com",
    serviceLabel: "Email Service",
    renewal: "2026-10-15", // Next month (October 2026)
    statusBadge: "Due Next Month (Oct 2026)",
    currency: "INR",
  },
  {
    id: "apollo",
    tool: "Apollo.io",
    provider: "Apollo.io Enterprise Leads & Sequence Engine",
    badge: "15% OFF Special Renewal",
    title: "Apollo.io — Direct Renewal Card",
    description: "Annual subscription renewal for global B2B contact intelligence & cold outreach. Billed annually in INR (converted from $5,712.00 USD at ₹84.00/$).",
    originalPrice: 564480.00, // from $6,720 regular rate * 84
    price: 479808.00, // $5,712 * 84
    originalUsd: "$5,712.00 USD",
    discount: "15% OFF",
    savings: 84672.00,
    monthlyEquivalent: 39984.00, // $476 * 84
    validity: "Annual (12 Mos)",
    metricLabel: "Outreach Leads",
    metricValue: "Unlimited",
    account: "shashank.jha@tecnoprism.com",
    serviceLabel: "Account Owner",
    renewal: "2027-02-10",
    statusBadge: "Feb 10, 2027",
    currency: "INR",
    usdNote: "Converted from $5,712.00 USD @ ₹84.00/$",
  },
  {
    id: "canva",
    tool: "Canva",
    provider: "Canva Pro Team Workspace",
    badge: "16% OFF Special Renewal",
    title: "Canva — Direct Renewal Card",
    description: "Annual workspace subscription for brand assets, social media graphics, and sales deck design. Direct renewal lock-in at ₹4,000.00 / year.",
    originalPrice: 4788.00,
    price: 4000.00,
    discount: "16% OFF",
    savings: 788.00,
    monthlyEquivalent: 333.33,
    validity: "Annual (12 Mos)",
    metricLabel: "Team Members",
    metricValue: "1 Member",
    account: "shashank.jha@tecnoprism.com",
    serviceLabel: "Account Owner",
    renewal: "2027-04-07",
    statusBadge: "Apr 07, 2027",
    currency: "INR",
  },
  {
    id: "chatgpt",
    tool: "ChatGPT Business",
    provider: "OpenAI ChatGPT Business Workspace",
    badge: "10% OFF Special Renewal",
    title: "ChatGPT Business — Direct Renewal Card",
    description: "Team workspace subscription for OpenAI GPT-4o & o1 reasoning models with shared team workspaces and zero data training privacy.",
    originalPrice: 48000.00,
    price: 43200.00,
    discount: "10% OFF",
    savings: 4800.00,
    monthlyEquivalent: 3600.00,
    validity: "Annual (12 Mos)",
    metricLabel: "Workspace Seats",
    metricValue: "2 Seats",
    account: "shashank.jha@tecnoprism.com, marketing@tecnoprism.com",
    serviceLabel: "Account Owner",
    renewal: "2027-07-30",
    statusBadge: "Jul 30, 2027",
    currency: "INR",
  },
  {
    id: "claude",
    tool: "Claude Pro",
    provider: "Anthropic Claude Pro Subscription",
    badge: "8% OFF Special Renewal",
    title: "Claude Pro — Direct Renewal Card",
    description: "Dedicated Claude Pro account with Claude 3.5 Sonnet access, 5x standard usage limits, and artifact generation capabilities.",
    originalPrice: 22106.67,
    price: 20338.14,
    discount: "8% OFF",
    savings: 1768.53,
    monthlyEquivalent: 1694.85,
    validity: "Annual (12 Mos)",
    metricLabel: "Pro Seat",
    metricValue: "1 Seat",
    account: "yash.prajapati@tecnoprism.com",
    serviceLabel: "Account Owner",
    renewal: "2027-07-30",
    statusBadge: "Jul 30, 2027",
    currency: "INR",
  },
  {
    id: "higgsfield",
    tool: "Higgsfield",
    provider: "Higgsfield AI Video Generation Studio",
    badge: "20% OFF Special Renewal",
    title: "Higgsfield — Direct Renewal Card",
    description: "High-resolution AI motion video generation plan committed for 2 years. Renewal scheduled for January 2028.",
    originalPrice: 107227.50,
    price: 85782.00,
    discount: "20% OFF",
    savings: 21445.50,
    monthlyEquivalent: 3574.25,
    validity: "2 Years (24 Mos)",
    metricLabel: "Video Engine",
    metricValue: "Enterprise",
    account: "yash.prajapati@tecnoprism.com",
    serviceLabel: "Account Owner",
    renewal: "2028-01-15",
    statusBadge: "Jan 2028",
    currency: "INR",
  },
];

export const DIRECT_SMTP_PLAN = RENEWAL_PLANS[0];

/**
 * Parses any date format string (YYYY-MM-DD, Month YYYY, etc.) into a UTC Date
 */
export function parseRenewalDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (m) {
    return new Date(Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 15));
  }
  const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (s.toLowerCase().includes(MONTH_NAMES[i])) {
      const ym = s.match(/\b(20\d\d)\b/);
      const year = ym ? +ym[1] : 2026;
      const dm = s.match(/\b([12]\d|3[01]|0?[1-9])\b/);
      const day = dm ? +dm[1] : 15;
      return new Date(Date.UTC(year, i, day));
    }
  }
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t);
}

/**
 * Checks whether a renewal date is strictly in NEXT MONTH relative to reference date.
 * "agar next month me koi renewal aa raha to khali usko hi represent karna hai kisi aur ko nahi."
 */
export function isRenewalDueNextMonth(renewalVal, referenceDate = new Date()) {
  if (!renewalVal) return false;
  const d = parseRenewalDate(renewalVal);
  if (!d) return false;

  const ref = referenceDate;
  const curYear = ref.getFullYear();
  const curMonth = ref.getMonth(); // 0-indexed: 8 = Sep

  const nextMonth = (curMonth + 1) % 12;
  const nextMonthYear = curMonth === 11 ? curYear + 1 : curYear;

  const rYear = d.getFullYear();
  const rMonth = d.getMonth();

  return rYear === nextMonthYear && rMonth === nextMonth;
}

/**
 * Checks whether a renewal date has already passed its renewal month.
 * "fir jab uska renewal month chala jaye to vo nahi dikhna chahiye."
 */
export function isRenewalExpired(renewalVal, referenceDate = new Date()) {
  if (!renewalVal) return false;
  const d = parseRenewalDate(renewalVal);
  if (!d) return false;

  const ref = referenceDate;
  const curYear = ref.getFullYear();
  const curMonth = ref.getMonth();

  const rYear = d.getFullYear();
  const rMonth = d.getMonth();

  if (rYear < curYear) return true;
  if (rYear === curYear && rMonth < curMonth) return true;
  return false;
}

/**
 * Exact Direct Renewal Card from the user's reference image (Image 1)
 */
export function DirectRenewalCard({
  plan = DIRECT_SMTP_PLAN,
  plans = [DIRECT_SMTP_PLAN],
  activeIndex = 0,
  onSelectIndex,
  onGetNow,
  className = "",
}) {
  const showDots = plans && plans.length > 1;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* The EXACT Card matching user screenshot (Image 1) */}
      <div className="w-[310px] bg-white rounded-2xl border border-slate-200/90 shadow-lg p-5 select-none transition-all duration-200 hover:shadow-xl relative group">
        {/* Top row: Strikethrough price + discount badge */}
        <div className="flex items-center justify-between min-h-[26px]">
          <span className="text-slate-500 line-through text-sm font-medium tracking-tight font-mono">
            ₹{plan.originalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="bg-[#5B9B00] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide">
            {plan.discount}
          </span>
        </div>

        {/* Main Big Price */}
        <div className="mt-2 text-[32px] font-extrabold text-slate-900 tracking-tight font-sans">
          ₹{plan.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Hairline Divider */}
        <div className="border-t border-slate-100 my-4" />

        {/* Two Columns: Validity & Metric (Credits, Seats, etc.) */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-400 font-medium text-[11px]">Validity</div>
            <div className="text-slate-800 font-bold text-sm mt-0.5">
              {plan.validity}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 font-medium text-[11px]">{plan.metricLabel}</div>
            <div className="text-slate-800 font-bold text-sm mt-0.5 font-mono">
              {plan.metricValue}
            </div>
          </div>
        </div>

        {/* Center 'Get Now' Button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => onGetNow?.(plan)}
            className="bg-[#625AF8] hover:bg-[#5249E0] active:scale-95 text-white font-semibold text-sm px-9 py-2 rounded-full shadow-md transition-all cursor-pointer"
          >
            Get Now
          </button>
        </div>
      </div>

      {/* Carousel Dots indicator matching screenshot [===]  o  o  o (Only shown if multiple tools due) */}
      {showDots && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {plans.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectIndex?.(i)}
              title={`View ${p.tool} renewal`}
              aria-label={`Go to slide ${i + 1}: ${p.tool}`}
              className={`transition-all duration-200 cursor-pointer ${
                activeIndex === i
                  ? "w-6 h-1.5 bg-[#625AF8] rounded-full"
                  : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Backwards-compatible export for SMTP direct card */
export function SmtpDirectRenewalCard({ onGetNow, className = "" }) {
  return <DirectRenewalCard plan={DIRECT_SMTP_PLAN} onGetNow={onGetNow} className={className} />;
}

/**
 * Full Renewal Banner matching user Image 1 layout.
 * Strictly represents ONLY the renewal(s) coming up in the NEXT MONTH.
 * Once a renewal month passes, it disappears automatically.
 */
export function ToolRenewalBanner({
  plans = RENEWAL_PLANS,
  activeIndex = 0,
  onSelectIndex,
  onGetNow,
  referenceDate = new Date(),
  className = "",
}) {
  // Filter plans: ONLY represent those whose renewal is due NEXT MONTH!
  // "agar next month me koi renewal aa raha to khali usko hi represent karna hai kisi aur ko nahi."
  // "fir jab uska renewal month chala jaye to vo nahi dikhna chahiye."
  const duePlans = useMemo(() => {
    return plans.filter((p) => isRenewalDueNextMonth(p.renewal, referenceDate));
  }, [plans, referenceDate]);

  // If no renewals due in the next month, do not display the renewal banner!
  if (!duePlans.length) {
    return (
      <div className={`rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/60 via-white to-white p-4 shadow-xs flex items-center justify-between text-xs text-emerald-800 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center font-bold text-base shadow-2xs">
            ✓
          </div>
          <div>
            <span className="font-extrabold text-slate-800 block text-sm">
              All Subscriptions Up-To-Date
            </span>
            <span className="text-slate-500 text-[11px]">
              No software renewals are due in the upcoming month. Direct renewal cards appear automatically when a subscription enters its renewal month.
            </span>
          </div>
        </div>
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
          Next Renewal Cycle Clear
        </span>
      </div>
    );
  }

  // Safe active plan (clamped to duePlans)
  const safeIndex = Math.min(activeIndex, duePlans.length - 1);
  const currentPlan = duePlans[safeIndex] || duePlans[0];

  const handlePrev = () => {
    const nextIdx = (safeIndex - 1 + duePlans.length) % duePlans.length;
    onSelectIndex?.(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (safeIndex + 1) % duePlans.length;
    onSelectIndex?.(nextIdx);
  };

  // Get current date's next month label for heading (e.g. October 2026)
  const nextMonthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  const nextMonthName = nextMonthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className={`rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white p-6 shadow-sm ${className}`}>
      {/* Top bar indicating that this renewal is exclusively for the upcoming month */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-indigo-100/70">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#5B9B00] text-white tracking-wide uppercase shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Renewal Due Next Month ({nextMonthName})
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {duePlans.length === 1 ? `Exclusively representing ${currentPlan.tool}` : `${duePlans.length} renewals due`}
          </span>
        </div>

        {/* If multiple renewals due in next month, allow switching between them */}
        {duePlans.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {duePlans.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectIndex?.(i)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    safeIndex === i
                      ? "bg-[#625AF8] text-white shadow-2xs font-bold"
                      : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70"
                  }`}
                >
                  {p.tool}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Renewal"
                className="h-7 w-7 rounded-lg bg-white/90 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs text-xs"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Renewal"
                className="h-7 w-7 rounded-lg bg-white/90 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs text-xs"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Info Column (matching Image 1) */}
        <div className="max-w-xl space-y-3 text-left">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#5B9B00] text-white tracking-wide uppercase shadow-2xs">
              {currentPlan.badge}
            </span>
            <span className="text-xs text-slate-400 font-medium">{currentPlan.provider}</span>
            {currentPlan.statusBadge && (
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                {currentPlan.statusBadge}
              </span>
            )}
          </div>

          <h2 className="text-xl font-black text-slate-900 font-display">
            {currentPlan.title}
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            {currentPlan.description}
          </p>

          {/* 3 Stats Grid matching user Image 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Monthly Equivalent</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                ₹{currentPlan.monthlyEquivalent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Savings</span>
              <span className="text-sm font-bold text-[#5B9B00] font-mono">
                ₹{currentPlan.savings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({currentPlan.discount})
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">{currentPlan.serviceLabel || "Service Account"}</span>
              <span className="text-xs font-semibold text-indigo-700 truncate block" title={currentPlan.account}>
                {currentPlan.account}
              </span>
            </div>
          </div>
        </div>

        {/* Right Direct Renewal Card (Exact from Image 1) */}
        <div className="shrink-0">
          <DirectRenewalCard
            plan={currentPlan}
            plans={duePlans}
            activeIndex={safeIndex}
            onSelectIndex={onSelectIndex}
            onGetNow={onGetNow}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Universal Tool Renewal Modal Popup for any subscription renewal
 */
export function ToolRenewalModal({ isOpen, onClose, selectedPlan = DIRECT_SMTP_PLAN }) {
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [activePlan, setActivePlan] = useState(selectedPlan);

  useEffect(() => {
    if (selectedPlan) {
      setActivePlan(selectedPlan);
    }
  }, [selectedPlan]);

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
      orderId: `${activePlan.tool.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`,
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
                {activePlan.tool} Renewal
              </h2>
              <p className="text-[11px] text-slate-400">
                Direct renewal for {activePlan.metricValue} {activePlan.metricLabel}
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
                  Your renewal for <span className="font-semibold text-slate-700">{activePlan.tool} ({activePlan.validity})</span> has been approved.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-left text-xs space-y-2 max-w-xs mx-auto shadow-2xs">
                <div className="flex justify-between text-slate-500">
                  <span>Order Reference:</span>
                  <span className="font-mono font-bold text-slate-800">#{orderConfirmed.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tool / Service:</span>
                  <span className="font-semibold text-slate-900">{activePlan.tool}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Amount ({activePlan.discount}):</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{activePlan.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {activePlan.usdNote && (
                  <div className="flex justify-between text-cyan-700 bg-cyan-50/70 p-1.5 rounded-lg text-[10px]">
                    <span>USD Conversion:</span>
                    <span className="font-mono font-bold">{activePlan.usdNote}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Validity:</span>
                  <span className="font-semibold text-slate-700">{activePlan.validity}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{activePlan.metricLabel}:</span>
                  <span className="font-semibold text-slate-700">{activePlan.metricValue}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Account:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={activePlan.account}>
                    {activePlan.account}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob(
                      [
                        `${activePlan.tool.toUpperCase()} RENEWAL INVOICE\n` +
                        `Order ID: #${orderConfirmed.orderId}\n` +
                        `Date: ${orderConfirmed.date}\n` +
                        `Provider: ${activePlan.provider}\n` +
                        `Validity: ${activePlan.validity}\n` +
                        `${activePlan.metricLabel}: ${activePlan.metricValue}\n` +
                        `Original Price: INR ${activePlan.originalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` +
                        `Discount: ${activePlan.discount} (Saved INR ${activePlan.savings.toLocaleString("en-IN", { minimumFractionDigits: 2 })})\n` +
                        `Total Payable (INR): INR ${activePlan.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` +
                        (activePlan.usdNote ? `Currency Conversion Note: ${activePlan.usdNote}\n` : "") +
                        `Account: ${activePlan.account}\n` +
                        `Status: Approved & Active`
                      ],
                      { type: "text/plain" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${activePlan.tool.replace(/\s+/g, "_")}-Renewal-Invoice-${orderConfirmed.orderId}.txt`;
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
                  {activePlan.badge}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {activePlan.metricValue} {activePlan.metricLabel} with {activePlan.validity} Validity
                </p>
                {activePlan.usdNote && (
                  <p className="text-[10px] text-cyan-700 font-semibold mt-0.5">
                    {activePlan.usdNote}
                  </p>
                )}
              </div>

              <DirectRenewalCard
                plan={activePlan}
                plans={[activePlan]}
                activeIndex={0}
                onGetNow={handleGetNow}
              />

              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-400">
                  Direct lock-in renewal for active Tecnoprism software infrastructure
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Provider: {activePlan.provider}</span>
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

/** Backwards-compatible export */
export const SmtpRenewalModal = ToolRenewalModal;
