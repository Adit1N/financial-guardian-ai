export interface IndiaTaxInput {
  taxYear: "2026-27";
  regime: "new";
  residentIndividual: boolean;
  hasSpecialRateIncome: boolean;
  annualTaxableIncomePaise: number;
}

export function calculateIndiaTax(input: IndiaTaxInput) {
  if (input.taxYear !== "2026-27" || input.regime !== "new") {
    throw new Error("Supported configuration: 2026-27, new regime.");
  }

  if (input.residentIndividual !== true) {
    throw new Error("This version supports resident individuals.");
  }

  if (input.hasSpecialRateIncome !== false) {
    throw new Error(
      "Special-rate income, such as capital gains, requires a separate calculation."
    );
  }

  const incomePaise = input.annualTaxableIncomePaise;

  if (!Number.isSafeInteger(incomePaise) || incomePaise < 0) {
    throw new Error("Taxable income must be a non-negative integer in paise.");
  }

  if (incomePaise > 500_000_000) {
    throw new Error("This version supports taxable income up to ₹50 lakh.");
  }

  const incomeRupees = incomePaise / 100;

  const slabs = [
    { lower: 0, upper: 400_000, rate: 0 },
    { lower: 400_000, upper: 800_000, rate: 0.05 },
    { lower: 800_000, upper: 1_200_000, rate: 0.10 },
    { lower: 1_200_000, upper: 1_600_000, rate: 0.15 },
    { lower: 1_600_000, upper: 2_000_000, rate: 0.20 },
    { lower: 2_000_000, upper: 2_400_000, rate: 0.25 },
    { lower: 2_400_000, upper: Infinity, rate: 0.30 },
  ];

  let slabTaxRupees = 0;

  for (const slab of slabs) {
    const taxablePart = Math.max(
      0,
      Math.min(incomeRupees, slab.upper) - slab.lower
    );

    slabTaxRupees += taxablePart * slab.rate;
  }

  let rebateRupees = 0;
  let marginalReliefRupees = 0;

  if (incomeRupees <= 1_200_000) {
    rebateRupees = Math.min(slabTaxRupees, 60_000);
  } else {
    const incomeAboveThreshold = incomeRupees - 1_200_000;

    marginalReliefRupees = Math.max(
      0,
      slabTaxRupees - incomeAboveThreshold
    );
  }

  const taxAfterReliefPaise = Math.round(
    (slabTaxRupees - rebateRupees - marginalReliefRupees) * 100
  );

  const cessPaise = Math.round(taxAfterReliefPaise * 0.04);

  return {
    taxYear: input.taxYear,
    regime: input.regime,
    annualTaxableIncomePaise: incomePaise,
    slabTaxPaise: Math.round(slabTaxRupees * 100),
    rebatePaise: Math.round(rebateRupees * 100),
    marginalReliefPaise: Math.round(marginalReliefRupees * 100),
    cessPaise,
    estimatedTaxPaise: taxAfterReliefPaise + cessPaise,
  };
}