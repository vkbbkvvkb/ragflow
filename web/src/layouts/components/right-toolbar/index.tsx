import { ReactComponent as LogoutIcon } from '@/assets/svg/logout.svg';
import { useTranslate } from '@/hooks/common-hooks';
import { useLogout } from '@/hooks/login-hooks';
import { useFetchUserInfo } from '@/hooks/user-setting-hooks';
import { Avatar, Dropdown, MenuProps, Space } from 'antd';
import styled from './index.less';

const RightToolBar = () => {
  const { t } = useTranslate('setting');
  const { logout } = useLogout();
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    logout();
  };
  const user_logout_menu: MenuProps['items'] = [
    {
      key: '1',
      onClick: handleMenuClick,
      label: (
        <Space>
          <LogoutIcon />
          {t('logout')}
        </Space>
      ),
    },
  ];
  const { data: userInfo, loading } = useFetchUserInfo();

  return (
    <div className={styled.toolbarWrapper}>
      <Space size={16}>
        <Dropdown menu={{ items: user_logout_menu }}>
          <Space size={12}>
            <Avatar size="small" src={userInfo.avatar} />
            <span>{userInfo.nickname}</span>
          </Space>
        </Dropdown>
      </Space>
    </div>
  );
};

export default RightToolBar;
