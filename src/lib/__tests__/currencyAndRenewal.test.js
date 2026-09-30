import { describe, it, expect } from "vitest";
import { USD_TO_INR } from "../../state/useDashboard.js";
import {
  RENEWAL_PLANS,
  DIRECT_SMTP_PLAN,
  isRenewalDueNextMonth,
  isRenewalExpired,
  parseRenewalDate,
} from "../../components/SmtpRenewalModal.jsx";

describe("Currency Conversion and Tool Renewals", () => {
  it("defines standard USD to INR conversion rate as 84.0", () => {
    expect(USD_TO_INR).toBe(84.0);
  });

  it("accurately converts Apollo.io USD pricing into INR", () => {
    const apolloAnnualUsd = 5712.0;
    const apolloMonthlyUsd = 476.0;

    const apolloAnnualInr = apolloAnnualUsd * USD_TO_INR;
    const apolloMonthlyInr = apolloMonthlyUsd * USD_TO_INR;

    expect(apolloAnnualInr).toBe(479808.0);
    expect(apolloMonthlyInr).toBe(39984.0);
  });

  it("contains renewable tools matching Image 1 specification", () => {
    expect(RENEWAL_PLANS.length).toBeGreaterThanOrEqual(6);

    const smtpPlan = RENEWAL_PLANS.find((p) => p.id === "smtp");
    expect(smtpPlan).toBeDefined();
    expect(smtpPlan.price).toBe(5851.62);
    expect(smtpPlan.originalPrice).toBe(6159.60);
    expect(smtpPlan.discount).toBe("5% OFF");
    expect(smtpPlan.validity).toBe("3 Months");
    expect(smtpPlan.metricLabel).toBe("Email Credits");
    expect(smtpPlan.metricValue).toBe("75000");

    const apolloPlan = RENEWAL_PLANS.find((p) => p.id === "apollo");
    expect(apolloPlan).toBeDefined();
    expect(apolloPlan.price).toBe(479808.0);
    expect(apolloPlan.monthlyEquivalent).toBe(39984.0);
    expect(apolloPlan.currency).toBe("INR");
    expect(apolloPlan.usdNote).toContain("5,712.00 USD");
  });

  it("strictly filters renewals to ONLY next month and excludes far future & expired renewals", () => {
    // Reference date: September 29, 2026
    const septDate = new Date(2026, 8, 29);

    // Next month is October 2026
    expect(isRenewalDueNextMonth("2026-10-15", septDate)).toBe(true);
    expect(isRenewalDueNextMonth("Oct 2026", septDate)).toBe(true);

    // Far-future renewals (February 2027, April 2027, Jan 2028) must NOT be represented
    expect(isRenewalDueNextMonth("2027-02-10", septDate)).toBe(false);
    expect(isRenewalDueNextMonth("2027-04-07", septDate)).toBe(false);
    expect(isRenewalDueNextMonth("2027-07-30", septDate)).toBe(false);
    expect(isRenewalDueNextMonth("Jan 2028", septDate)).toBe(false);

    // Expired renewals (April 2026) must NOT be represented
    expect(isRenewalDueNextMonth("Apr 2026", septDate)).toBe(false);
    expect(isRenewalExpired("Apr 2026", septDate)).toBe(true);

    // In September 2026, ONLY SMTP Provider is due next month!
    const duePlansInSept = RENEWAL_PLANS.filter((p) => isRenewalDueNextMonth(p.renewal, septDate));
    expect(duePlansInSept.length).toBe(1);
    expect(duePlansInSept[0].tool).toBe("SMTP Provider");
  });

  it("ensures renewal disappears once its renewal month has passed", () => {
    // When date advances to November 2026, October 2026 renewal (SMTP) has passed:
    const novDate = new Date(2026, 10, 5);

    expect(isRenewalDueNextMonth("2026-10-15", novDate)).toBe(false);
    expect(isRenewalExpired("2026-10-15", novDate)).toBe(true);

    const duePlansInNov = RENEWAL_PLANS.filter((p) => isRenewalDueNextMonth(p.renewal, novDate));
    expect(duePlansInNov.length).toBe(0);
  });
});
