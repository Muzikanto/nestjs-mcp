export function extractResourceParams(template: string, actual: string) {
  const a = new URL(actual);

  const templateParts = template.split("/");
  const actualParts = actual.split("/");

  const params: Record<string, string> = {};

  templateParts.forEach((part, i) => {
    if (part.startsWith("{") && part.endsWith("}")) {
      const key = part.slice(1, -1);
      params[key] = actualParts[i];
    }
  });

  return {
    ...params,
    ...Object.fromEntries(a.searchParams.entries()),
  };
}
