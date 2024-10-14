import { ISetting } from '@/interfaces/database/search';
import i18n from '@/locales/config';
import searchService from '@/services/search-service';
import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';

export const useSetSearchSetting = () => {
  // const queryClient = useQueryClient();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ['setSearch'],
    mutationFn: async (params: ISetting) => {
      const { data } = await searchService.saveSetting(params);
      if (data.retcode === 0) {
        // queryClient.invalidateQueries({
        //     exact: false,
        //     queryKey: ['fetchDialogList'],
        // });
        //
        // queryClient.invalidateQueries({
        //     queryKey: ['fetchDialog'],
        // });
        message.success(
          i18n.t(`message.${params.id ? 'modified' : 'created'}`),
        );
      }
      return data?.retcode;
    },
  });

  return { data, loading, setSearch: mutateAsync };
};

export const useFetchSearchSetting = () => {
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ['fetchSearchSetting'],
    gcTime: 0,
    mutationFn: async () => {
      try {
        const ret = await searchService.getSettingDetail();
        return ret?.data?.data ?? {};
      } catch (error) {
        // if (has(error, 'message')) {
        //     message.error(error.message);
        // }
        return {};
      }
    },
  });

  return { data, loading, fetchSearchSetting: mutateAsync };
};
