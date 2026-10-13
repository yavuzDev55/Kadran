const FAKE = new URL('./fakePrisma.js', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context);
  if (result.url.endsWith('/src/config/database.js')) {
    return { url: FAKE, shortCircuit: true };
  }
  return result;
}
