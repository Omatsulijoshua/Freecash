export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      result[key] = sanitizeHtml(obj[key]);
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}
