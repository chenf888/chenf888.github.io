import { clsx, type ClassValue } from 'clsx'

/** 组合 className */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}