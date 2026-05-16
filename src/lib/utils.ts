
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('en-IN', options);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

export function calculateRevenueShare(revenue: number): {share: number, percentage: number} {
  // Calculate share percentage: 5% if revenue > ₹250, 10% if revenue ≤ ₹250
  const sharePercentage = revenue > 250 ? 5 : 10;
  const share = (revenue * sharePercentage) / 100;
  
  return {
    share,
    percentage: sharePercentage
  };
}
