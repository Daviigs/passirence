import { describe, expect, it } from 'vitest';
import { formatCurrencyBRL } from './currency.util.js';

describe('currency.util', () => {
  it('formata valor em BRL', () => {
    const formatted = formatCurrencyBRL(80);
    expect(formatted).toMatch(/R\$\s?80/);
  });

  it('formata centavos', () => {
    const formatted = formatCurrencyBRL(49.9);
    expect(formatted).toMatch(/49/);
  });

  it('formata zero', () => {
    const formatted = formatCurrencyBRL(0);
    expect(formatted).toMatch(/R\$\s?0/);
  });
});
