/**
 * Menjalankan semua promise dan mengumpulkan hasil serta error-nya,
 * tanpa berhenti di kegagalan pertama (beda dengan Promise.all biasa).
 */
const promiseAll = async <T>(promises: Promise<T>[]) => {
  // Bungkus tiap promise supaya selalu resolve: [hasil, error]
  const settled = promises.map(
    (promise) =>
      new Promise<[T, undefined] | [undefined, unknown]>((resolve) => {
        promise.then((result) => resolve([result, undefined])).catch((error) => resolve([undefined, error]));
      })
  );

  const errors: unknown[] = [];
  const results: T[] = [];

  (await Promise.all(settled)).forEach(([result, error]) => {
    if (error !== undefined) {
      errors.push(error);
    } else {
      results.push(result as T);
    }
  });

  return { errors, results };
};

export default promiseAll;
