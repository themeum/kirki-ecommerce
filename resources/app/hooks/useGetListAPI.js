import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const useGetListAPI = ({
  reducerName = 'categories',
  apiCallBack,
  nestedToggler,
  limit = false,
  page,
  search,
  sort_by,
  sort_order,
  filter,
}) => {
  const _page = page ?? useSelector((state) => state[reducerName]?.page);
  const _search = search ?? useSelector((state) => state[reducerName]?.search);
  const _sort_by = sort_by ?? useSelector((state) => state[reducerName]?.sort_by);
  const _sort_order = sort_order ?? useSelector((state) => state[reducerName]?.sort_order);
  const toggler = useSelector((state) => {
    if (!nestedToggler?.length) {
      return state[reducerName]?.toggler;
    }
    let current = state[reducerName];
    nestedToggler.forEach((key) => {
      current = current?.[key];
    });
    return current?.toggler;
  });
  const _limit = limit || useSelector((state) => state[reducerName]?.limit);
  const _filter = filter || useSelector((state) => state[reducerName]?.filter);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      apiCallBack({
        search: _search,
        sort_by: _sort_by,
        sort_order: _sort_order,
        page: _page,
        limit: _limit,
        ...(_filter || {}),
      }),
    );
  }, [_search, _sort_by, _sort_order, _page, toggler, _filter]);
};

export default useGetListAPI;
