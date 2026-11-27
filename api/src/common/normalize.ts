import type { TransformFnParams } from 'class-transformer';

/** E-mails são comparados sem diferenciar maiúsculas e sem espaços nas pontas. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Para uso com @Transform() em DTOs. */
export const toNormalizedEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? normalizeEmail(value) : value;

export const toTrimmed = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;
