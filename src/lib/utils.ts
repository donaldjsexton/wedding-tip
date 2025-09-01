import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a unique slug for wedding couples
export function generateWeddingSlug(coupleName: string): string {
  const baseSlug = coupleName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

// Calculate tip recommendations based on service type and hours
export function calculateTipRecommendations(role: string, serviceHours?: number, serviceRate?: number) {
  const baseRates = {
    OFFICIANT: { flat: [50, 100, 200], percentage: [15, 20, 25] },
    COORDINATOR: { flat: [100, 200, 300], percentage: [15, 20, 25] },
    SETUP_ATTENDANT: { flat: [20, 40, 60], percentage: [15, 20, 25] },
    PHOTOGRAPHER: { flat: [100, 200, 400], percentage: [15, 20, 25] },
  }
  
  const rates = baseRates[role as keyof typeof baseRates] || baseRates.COORDINATOR
  
  let recommendations = {
    low: rates.flat[0],
    medium: rates.flat[1],
    high: rates.flat[2],
  }
  
  // If service rate provided, calculate percentage-based tips
  if (serviceRate && serviceHours) {
    const totalService = serviceRate * serviceHours
    recommendations = {
      low: Math.round(totalService * (rates.percentage[0] / 100)),
      medium: Math.round(totalService * (rates.percentage[1] / 100)),
      high: Math.round(totalService * (rates.percentage[2] / 100)),
    }
  }
  
  return recommendations
}

// Educational tips for each vendor type
export const tippingEtiquette = {
  OFFICIANT: [
    "Tip your officiant 10-20% of their fee, or $50-$100 minimum",
    "Consider extra if they traveled far or accommodated special requests",
    "Cash in an envelope is traditional, but digital payments work too"
  ],
  COORDINATOR: [
    "Wedding coordinators often receive 15-20% of their fee",
    "They work long hours - consider tipping $100-$300 based on service level",
    "A heartfelt note along with the tip means a lot"
  ],
  SETUP_ATTENDANT: [
    "Setup staff typically receive $20-$50 per person",
    "Consider the physical demands and hours worked",
    "Tip more for exceptional service or challenging conditions"
  ],
  PHOTOGRAPHER: [
    "Photography tips range from $50-$200 depending on package size",
    "Not required if gratuity is built into contract",
    "Consider extra for going above and beyond"
  ]
}

