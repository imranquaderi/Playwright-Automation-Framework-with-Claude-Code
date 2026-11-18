import testData from '../test-data/test_data.json';

/** All test data lives in tests/test-data/test_data.json; import it from here. */
export { testData };

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive "contains" matcher for a plain string from test_data.json. */
export const text = (value: string) => new RegExp(escapeRegex(value), 'i');

/** Case-insensitive whole-string matcher for a plain string from test_data.json. */
export const exactText = (value: string) => new RegExp(`^${escapeRegex(value)}$`, 'i');

/** Matches a URL ending with the given route, e.g. urlEndsWith(testData.routes.login). */
export const urlEndsWith = (route: string) => new RegExp(`${escapeRegex(route)}$`);

/** Fills {placeholders} in a template string from test_data.json. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key]));
