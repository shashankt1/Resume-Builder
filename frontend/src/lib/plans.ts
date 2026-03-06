// Pricing plans configuration
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic resume analysis',
    monthlyPrice: 0,
    yearlyPrice: 0,
    scansPerMonth: 10,
    features: [
      '10 free scans on signup',
      'ATS Resume Analyzer',
      '3 resume templates',
      'Public profile page',
      'Basic support',
    ],
    limitations: [
      'No Tailor to Job feature',
      'No Interview Prep',
      'No LinkedIn Optimizer',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For active job seekers',
    monthlyPrice: 199,
    yearlyPrice: 1999,
    scansPerMonth: 50,
    features: [
      '50 scans per month',
      'ATS Resume Analyzer',
      '10 resume templates',
      'Public profile page',
      'Email support',
    ],
    limitations: [
      'No Tailor to Job feature',
      'No Interview Prep',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Full power for serious job hunters',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    scansPerMonth: 200,
    popular: true,
    features: [
      '200 scans per month',
      'ATS Resume Analyzer',
      'Tailor to Job (AI rewrite)',
      'Interview Prep Mode',
      'LinkedIn Optimizer',
      '20 resume templates',
      'Priority support',
    ],
    limitations: [],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and recruiters',
    monthlyPrice: 3599,
    yearlyPrice: 35990,
    scansPerMonth: -1, // unlimited
    features: [
      'Unlimited scans',
      'All Pro features',
      'Team seats',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
    limitations: [],
  },
} as const

export type PlanId = keyof typeof PLANS

export const SCAN_COSTS = {
  ats_analysis: 1,
  tailor_to_job: 3,
  interview_prep: 5,
  linkedin_optimizer: 2,
} as const

export type ScanAction = keyof typeof SCAN_COSTS
