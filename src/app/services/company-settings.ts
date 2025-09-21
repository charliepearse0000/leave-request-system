// Company Settings Service
// Manages company-wide configuration including default leave allowances

export interface CompanySettings {
  defaultAnnualLeaveAllowance: number;
  defaultSickLeaveAllowance: number;
  companyName: string;
  allowCustomAllowances: boolean;
}

class CompanySettingsService {
  private static instance: CompanySettingsService;
  private settings: CompanySettings;

  private constructor() {
    // Default company settings
    this.settings = {
      defaultAnnualLeaveAllowance: 25,
      defaultSickLeaveAllowance: 10,
      companyName: "Your Company",
      allowCustomAllowances: true
    };
    
    // Load from localStorage if available
    this.loadSettings();
  }

  public static getInstance(): CompanySettingsService {
    if (!CompanySettingsService.instance) {
      CompanySettingsService.instance = new CompanySettingsService();
    }
    return CompanySettingsService.instance;
  }

  private loadSettings(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      const stored = localStorage.getItem('companySettings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load company settings from localStorage:', error);
    }
  }

  private saveSettings(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return;
      }
      
      localStorage.setItem('companySettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save company settings to localStorage:', error);
    }
  }

  public getSettings(): CompanySettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<CompanySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  public getDefaultAnnualLeaveAllowance(): number {
    return this.settings.defaultAnnualLeaveAllowance;
  }

  public getDefaultSickLeaveAllowance(): number {
    return this.settings.defaultSickLeaveAllowance;
  }

  public setDefaultAllowances(annual: number, sick: number): void {
    this.updateSettings({
      defaultAnnualLeaveAllowance: annual,
      defaultSickLeaveAllowance: sick
    });
  }

  public canCustomizeAllowances(): boolean {
    return this.settings.allowCustomAllowances;
  }
}

// Export singleton instance
export const companySettings = CompanySettingsService.getInstance();
export default companySettings;