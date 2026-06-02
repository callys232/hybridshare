export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type BadgeVariant = 'default' | 'red' | 'black' | 'success' | 'warning';
export type DropdownPlacement = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}
