import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts clean Python code from LLM response that may contain explanations and code blocks
 * @param response - The full LLM response containing explanations and code
 * @returns Object with cleaned code and metadata
 */
export interface CodeExtractionResult {
  code: string;
  language: string;
  hasCodeBlock: boolean;
  originalLength: number;
  cleanedLength: number;
}

export function extractCode(response: string): CodeExtractionResult {
  if (!response || typeof response !== 'string') {
    return {
      code: '',
      language: '',
      hasCodeBlock: false,
      originalLength: 0,
      cleanedLength: 0
    };
  }

  const originalLength = response.length;
  let cleaned = response.trim();
  let language = 'python'; // Default to python
  let hasCodeBlock = false;

  // Pattern to match code blocks with optional language specification
  const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
  const matches = Array.from(cleaned.matchAll(codeBlockPattern));

  if (matches.length > 0) {
    hasCodeBlock = true;
    
    // Find the first Python code block or the first code block if no Python specified
    let selectedMatch = matches.find(match => {
      const lang = match[1]?.toLowerCase();
      return !lang || lang === 'python' || lang === 'py';
    }) || matches[0];

    if (selectedMatch) {
      language = selectedMatch[1]?.toLowerCase() || 'python';
      cleaned = selectedMatch[2].trim();
    }
  } else {
    // No code blocks found, try to extract code by removing common explanation patterns
    
    // Remove lines that start with explanation indicators
    const explanationPatterns = [
      /^EXPLANATION:.*$/gm,
      /^CODE:.*$/gm,
      /^Here's.*explanation.*:.*$/gm,
      /^In this code:.*$/gm,
      /^This.*code.*:.*$/gm,
      /^\*.*$/gm, // Remove bullet points
      /^You can run this.*$/gm
    ];

    explanationPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Remove multiple consecutive newlines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.trim();
  }

  // Final cleanup - remove any remaining backticks or unwanted characters
  cleaned = cleaned.replace(/^`+|`+$/g, '');
  cleaned = cleaned.trim();

  return {
    code: cleaned,
    language,
    hasCodeBlock,
    originalLength,
    cleanedLength: cleaned.length
  };
}

/**
 * Quick function to get just the clean code string
 * @param response - The full LLM response
 * @returns Clean Python code string
 */
export function getCleanCode(response: string): string {
  return extractCode(response).code;
}
