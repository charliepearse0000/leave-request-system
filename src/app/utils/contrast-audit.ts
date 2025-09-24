/**
 * Contrast Audit Utility
 * Checks if color combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
 */

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Check if contrast meets WCAG standards
function meetsWCAG(ratio: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean {
  if (level === 'AA') {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  } else {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
}

// Current theme colors
export const lightThemeColors = {
  background: '#ffffff',
  foreground: '#171717',
  primary: '#0651f1',
  primaryHover: '#1d4ed8',
  secondary: '#64748b',
  accent: '#f1f5f9',
  border: '#e2e8f0',
  muted: '#f8fafc',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const darkThemeColors = {
  background: '#0f172a',
  foreground: '#f1f5f9',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  secondary: '#64748b',
  accent: '#1e293b',
  border: '#334155',
  muted: '#0f172a',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

// Audit results interface
interface ContrastAuditResult {
  combination: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  meetsAALarge: boolean;
  recommendation?: string;
}

// Perform contrast audit
export function auditContrast(): {
  light: ContrastAuditResult[];
  dark: ContrastAuditResult[];
  summary: {
    light: { total: number; passing: number; failing: number };
    dark: { total: number; passing: number; failing: number };
  };
} {
  const lightResults: ContrastAuditResult[] = [];
  const darkResults: ContrastAuditResult[] = [];

  // Key color combinations to test
  const combinations = [
    { name: 'Text on Background', fg: 'foreground', bg: 'background' },
    { name: 'Primary on Background', fg: 'primary', bg: 'background' },
    { name: 'Secondary on Background', fg: 'secondary', bg: 'background' },
    { name: 'White on Primary', fg: '#ffffff', bg: 'primary' },
    { name: 'White on Primary Hover', fg: '#ffffff', bg: 'primaryHover' },
    { name: 'Success on Background', fg: 'success', bg: 'background' },
    { name: 'Warning on Background', fg: 'warning', bg: 'background' },
    { name: 'Error on Background', fg: 'error', bg: 'background' },
    { name: 'Text on Accent', fg: 'foreground', bg: 'accent' },
    { name: 'Text on Muted', fg: 'foreground', bg: 'muted' },
  ];

  // Test light theme
  combinations.forEach(combo => {
    const fgColor = combo.fg.startsWith('#') ? combo.fg : lightThemeColors[combo.fg as keyof typeof lightThemeColors];
    const bgColor = combo.bg.startsWith('#') ? combo.bg : lightThemeColors[combo.bg as keyof typeof lightThemeColors];
    
    const ratio = getContrastRatio(fgColor, bgColor);
    const result: ContrastAuditResult = {
      combination: `${combo.name} (Light)`,
      ratio: Math.round(ratio * 100) / 100,
      meetsAA: meetsWCAG(ratio, 'AA', 'normal'),
      meetsAAA: meetsWCAG(ratio, 'AAA', 'normal'),
      meetsAALarge: meetsWCAG(ratio, 'AA', 'large'),
    };

    if (!result.meetsAA) {
      result.recommendation = `Increase contrast to at least 4.5:1 (currently ${result.ratio}:1)`;
    }

    lightResults.push(result);
  });

  // Test dark theme
  combinations.forEach(combo => {
    const fgColor = combo.fg.startsWith('#') ? combo.fg : darkThemeColors[combo.fg as keyof typeof darkThemeColors];
    const bgColor = combo.bg.startsWith('#') ? combo.bg : darkThemeColors[combo.bg as keyof typeof darkThemeColors];
    
    const ratio = getContrastRatio(fgColor, bgColor);
    const result: ContrastAuditResult = {
      combination: `${combo.name} (Dark)`,
      ratio: Math.round(ratio * 100) / 100,
      meetsAA: meetsWCAG(ratio, 'AA', 'normal'),
      meetsAAA: meetsWCAG(ratio, 'AAA', 'normal'),
      meetsAALarge: meetsWCAG(ratio, 'AA', 'large'),
    };

    if (!result.meetsAA) {
      result.recommendation = `Increase contrast to at least 4.5:1 (currently ${result.ratio}:1)`;
    }

    darkResults.push(result);
  });

  const lightPassing = lightResults.filter(r => r.meetsAA).length;
  const darkPassing = darkResults.filter(r => r.meetsAA).length;

  return {
    light: lightResults,
    dark: darkResults,
    summary: {
      light: { total: lightResults.length, passing: lightPassing, failing: lightResults.length - lightPassing },
      dark: { total: darkResults.length, passing: darkPassing, failing: darkResults.length - darkPassing },
    },
  };
}

// Generate improved color suggestions
export function generateImprovedColors() {
  const improvements = {
    light: {
      // Improve secondary text contrast
      secondary: '#475569', // Darker gray for better contrast
      // Ensure border has enough contrast
      border: '#d1d5db',
    },
    dark: {
      // Improve foreground contrast
      foreground: '#f8fafc',
      // Improve border contrast
      border: '#475569',
    },
  };

  return improvements;
}