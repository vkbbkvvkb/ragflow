import { Flex, Space, Typography } from 'antd';
import classNames from 'classnames';

import { useTranslate } from '@/hooks/common-hooks';
import styles from './index.less';

const { Title, Text } = Typography;

const LoginRightPanel = () => {
  const { t } = useTranslate('login');
  return (
    <section className={styles.rightPanel}>
      <Flex vertical gap={40}>
        <Title level={1} className={classNames(styles.blue, styles.loginTitle)}>
          {t('title')}
        </Title>
        <Text className={classNames(styles.pink, styles.loginDescription)}>
          {t('description')}
        </Text>
        <Flex align="center" gap={16}>
          <Flex vertical>
            <Space></Space>
          </Flex>
        </Flex>
      </Flex>
    </section>
  );
};

export default LoginRightPanel;
