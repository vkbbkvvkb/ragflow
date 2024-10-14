import { useFetchAppConf } from '@/hooks/logic-hooks';
import { useLogin, useRegister } from '@/hooks/login-hooks';
import { rsaPsw } from '@/utils';
import { Button, Form, Input } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'umi';
import styles from './index.less';
import RightPanel from './right-panel';

const Login = () => {
  const [title, setTitle] = useState('login');
  const navigate = useNavigate();
  const { login, loading: signLoading } = useLogin();
  const { register, loading: registerLoading } = useRegister();
  const { t } = useTranslation('translation', { keyPrefix: 'login' });
  const loading = signLoading || registerLoading;
  const appConf = useFetchAppConf();

  const changeTitle = () => {
    setTitle((title) => (title === 'login' ? 'register' : 'login'));
  };
  const [form] = Form.useForm();

  useEffect(() => {
    form.validateFields(['nickname']);
  }, [form]);

  const onCheck = async () => {
    try {
      const params = await form.validateFields();

      const rsaPassWord = rsaPsw(params.password) as string;

      if (title === 'login') {
        const retcode = await login({
          email: params.email,
          password: rsaPassWord,
        });
        if (retcode === 0) {
          navigate('/knowledge');
        }
      } else {
        const retcode = await register({
          nickname: params.nickname,
          email: params.email,
          password: rsaPassWord,
        });
        if (retcode === 0) {
          setTitle('login');
        }
      }
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };
  const formItemLayout = {
    labelCol: { span: 6 },
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginLeft}>
        <div className={styles.leftContainer}>
          <div className={styles.loginTitle}>
            <div>{appConf.appName}</div>
            <span>{title === 'login' ? t('login') : t('register')}</span>
          </div>

          <Form
            form={form}
            layout="vertical"
            name="dynamic_rule"
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              {...formItemLayout}
              name="email"
              label={t('emailLabel')}
              rules={[{ required: true, message: t('emailPlaceholder') }]}
            >
              <Input size="large" placeholder={t('emailPlaceholder')} />
            </Form.Item>
            {title === 'register' && (
              <Form.Item
                {...formItemLayout}
                name="nickname"
                label={t('nicknameLabel')}
                rules={[{ required: true, message: t('nicknamePlaceholder') }]}
              >
                <Input size="large" placeholder={t('nicknamePlaceholder')} />
              </Form.Item>
            )}
            <Form.Item
              {...formItemLayout}
              name="password"
              label={t('passwordLabel')}
              rules={[{ required: true, message: t('passwordPlaceholder') }]}
            >
              <Input.Password
                size="large"
                placeholder={t('passwordPlaceholder')}
                onPressEnter={onCheck}
              />
            </Form.Item>
            <div className={styles.loginButton}>
              {title === 'login' && (
                <Button type="default" size="middle" onClick={changeTitle}>
                  {t('signUp')}
                </Button>
              )}
              {title === 'register' && (
                <Button
                  type="default"
                  block
                  size="middle"
                  onClick={changeTitle}
                >
                  {t('signIn')}
                </Button>
              )}
              <Button
                type="primary"
                block
                size="middle"
                onClick={onCheck}
                loading={loading}
              >
                {title === 'login' ? t('login') : t('register')}
              </Button>
            </div>
          </Form>
        </div>
        <div className={styles.loginBottom}>
          <span className={styles.appYear}>
            {appConf.appYear}
            <a
              href="https://www.jandar.com.cn/"
              target="_blank"
              className={styles.appCompany}
            >
              {appConf.appCompany}
            </a>
          </span>
          <span className={styles.appVersion}>
            版本号：{appConf.appVersion}
          </span>
        </div>
      </div>
      <div className={styles.loginRight}>
        <RightPanel></RightPanel>
      </div>
    </div>
  );
};

export default Login;
