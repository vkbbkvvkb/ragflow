import api from '@/utils/api';
import registerServer from '@/utils/register-server';
import request from '@/utils/request';

const { get_setting_detail, save_setting } = api;

const methods = {
  getSettingDetail: {
    url: get_setting_detail,
    method: 'get',
  },
  saveSetting: {
    url: save_setting,
    method: 'post',
  },
} as const;

const searchService = registerServer<keyof typeof methods>(methods, request);

export default searchService;
