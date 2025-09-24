export interface RoleColorScheme {
  bg: string;
  text: string;
  border: string;
  darkBg: string;
  darkText: string;
  darkBorder: string;
}

export const getRoleColors = (roleName: string | undefined | null): RoleColorScheme => {
  // Handle null, undefined, or empty string cases
  if (!roleName || typeof roleName !== 'string') {
    roleName = 'employee'; // Default to employee if no role provided
  }
  
  const normalizedRole = roleName.toLowerCase();
  
  switch (normalizedRole) {
    case 'employee':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        darkBg: 'dark:bg-blue-900/20',
        darkText: 'dark:text-blue-300',
        darkBorder: 'dark:border-blue-700'
      };
    case 'manager':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        darkBg: 'dark:bg-orange-900/20',
        darkText: 'dark:text-orange-300',
        darkBorder: 'dark:border-orange-700'
      };
    case 'admin':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        darkBg: 'dark:bg-red-900/20',
        darkText: 'dark:text-red-300',
        darkBorder: 'dark:border-red-700'
      };
    default:
      // Fallback to blue for unknown roles
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        darkBg: 'dark:bg-blue-900/20',
        darkText: 'dark:text-blue-300',
        darkBorder: 'dark:border-blue-700'
      };
  }
};

export const getRoleBadgeClasses = (roleName: string | undefined | null): string => {
  const colors = getRoleColors(roleName);
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`;
};

export const getRoleCardClasses = (roleName: string | undefined | null): string => {
  const colors = getRoleColors(roleName);
  return `${colors.bg} ${colors.darkBg} ${colors.border} ${colors.darkBorder}`;
};

export const getRoleTextClasses = (roleName: string | undefined | null): string => {
  const colors = getRoleColors(roleName);
  return `${colors.text} ${colors.darkText}`;
};