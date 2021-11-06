/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @param promises the promise function
 */
const promiseAll = async <T>(promises: any) => {
  // Wrap all Promises in a Promise that will always "resolve"

  const resolvingPromises = promises.map((promise: Promise<any>) => {
    return new Promise((resolve) => {
      const payload = new Array(2);
      promise
        .then((result: T) => {
          payload[0] = result;
        })
        .catch((error: any) => {
          payload[1] = error;
        })
        .then(() => {
          /*
           * The wrapped Promise returns an array:
           * The first position in the array holds the result (if any)
           * The second position in the array holds the error (if any)
           */
          resolve(payload);
        });
    });
  });

  return Promise.all<[T, unknown]>(resolvingPromises).then((items: [T, unknown][]) => {
    const errors: unknown[] = [];
    const results: T[] = [];
    items.forEach((payload) => {
      if (payload[1]) {
        errors.push(payload[1]);
      } else {
        results.push(payload[0]);
      }
    });

    return {
      errors,
      results,
    };
  });
};

export default promiseAll;
