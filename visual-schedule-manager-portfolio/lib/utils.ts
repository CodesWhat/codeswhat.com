import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUserName(createdBy: string): { display: string; tooltip: string } {
  // Handle "Auto" case
  if (createdBy === "Auto") {
    return { display: "Auto", tooltip: "Automated sync" };
  }

  // Extract name and email from "Name (email)" format
  const match = createdBy.match(/^(.+?)\s*\((.+?)\)$/);
  
  if (match) {
    const [, fullName, email] = match;
    const nameParts = fullName.trim().split(' ');
    
    if (nameParts.length >= 2) {
      // Get first name and first initial of last name
      const firstName = nameParts[0];
      const lastInitial = nameParts[nameParts.length - 1][0];
      return {
        display: `${firstName} ${lastInitial}.`,
        tooltip: `${fullName} (${email})`
      };
    } else {
      // Single name
      return {
        display: fullName,
        tooltip: `${fullName} (${email})`
      };
    }
  }
  
  // Handle plain name without email
  const nameParts = createdBy.trim().split(' ');
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastInitial = nameParts[nameParts.length - 1][0];
    return {
      display: `${firstName} ${lastInitial}.`,
      tooltip: createdBy
    };
  }
  
  // Fallback
  return { display: createdBy, tooltip: createdBy };
}
