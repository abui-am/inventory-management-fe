import { QueryFunction, QueryKey, useQuery, UseQueryOptions, UseQueryResult } from 'react-query';

const useMyQuery = <TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData>,
  option?: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> => {
  const query = useQuery(queryKey, queryFn, {
    ...option,
  });
  return query;
};

export default useMyQuery;
