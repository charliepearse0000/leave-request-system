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
    this.settings = {
      defaultAnnualLeaveAllowance: 25,
      defaultSickLeaveAllowance: 10,
      companyName: "Your Company",
      allowCustomAllowances: true
    };
    
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
    } catch {
    }
  }

  private saveSettings(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      
      localStorage.setItem('companySettings', JSON.stringify(this.settings));
    } catch {
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

export const companySettings = CompanySettingsService.getInstance();
export default companySettings;