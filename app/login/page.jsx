'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styles from '@/src/css/login.module.css';
import httpClient from "@/src/lib/util/httpclient";
import { useRouter } from 'next/navigation';
import { mainUrl, storageKeys, urls } from "@/src/const";
import { useUser } from '@/src/context/UserContext';
import { App } from 'antd';

export default function Login() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    remember: false
  });
  const { setUser } = useUser();

  useEffect(() => {
    const savedUserId = localStorage.getItem(storageKeys.loginId);
    if (savedUserId) {
      setFormData(prev => ({
        ...prev,
        userId: savedUserId,
        remember: true
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await httpClient.post(urls.login, formData);
      if (response.data.result === 'EMAIL_NOT_VERIFIED') {
        modal.error({
          title: '이메일 인증 필요',
          content: '메일인증을 완료해주세요. 인증메일을 받지 못한경우 재전송 후 인증해주세요.',
          okText: '닫기',
          okCancel: true,
          cancelText: '인증메일 재전송',
          onCancel: async () => {
            try {
              const userId = formData.userId;
              const response = await httpClient.post(urls.signupResend + '/' + encodeURIComponent(userId));
              const result = response.data;

              let modalConfig = {
                title: '',
                content: ''
              };

              switch (result) {
                case 'SUCCESS':
                  modalConfig = {
                    title: '인증메일 재전송 성공',
                    content: '인증메일이 재전송되었습니다. 이메일을 확인해주세요.'
                  };
                  modal.success(modalConfig);
                  break;
                case 'INVALID_EMAIL':
                  modalConfig = {
                    title: '재전송 실패',
                    content: '유효하지 않은 이메일 주소입니다.'
                  };
                  modal.error(modalConfig);
                  break;
                case 'ALREADY_VERIFIED':
                  modalConfig = {
                    title: '재전송 불가',
                    content: '이미 인증이 완료된 이메일입니다.'
                  };
                  modal.info(modalConfig);
                  break;
                case 'RECENTLY_SENT':
                  modalConfig = {
                    title: '재전송 제한',
                    content: '최근에 발송된 인증메일이 있습니다. 잠시 후 다시 시도해주세요.'
                  };
                  modal.warning(modalConfig);
                  break;
                default:
                  modalConfig = {
                    title: '재전송 실패',
                    content: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                  };
                  modal.error(modalConfig);
              }
            } catch (error) {
              console.log(error);
              modal.error({
                title: '재전송 실패',
                content: '인증메일 재전송 중 오류가 발생했습니다.'
              });
            }
          }
        });
        return;
      }
      console.log(response);
      const accessToken = response.data.accessToken;
      const refreshToken = response.data.refreshToken;
      localStorage.setItem(storageKeys.accessToken, accessToken);
      localStorage.setItem(storageKeys.refreshToken, refreshToken);
      setUser(response.data.user);

      if (formData.remember) {
        localStorage.setItem(storageKeys.loginId, formData.userId);
      } else {
        localStorage.removeItem(storageKeys.loginId);
      }

      // 저장된 returnUrl이 있으면 해당 페이지로, 없으면 기본 페이지로
      const returnUrl = localStorage.getItem(storageKeys.returnUrl) || mainUrl;
      localStorage.removeItem(storageKeys.returnUrl); // returnUrl 삭제
      router.push(returnUrl);
    } catch (error) {
      console.log(error);
      modal.error({
        title: '로그인 실패',
        content: '아이디 또는 비밀번호를 확인해주세요.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'remember' ? checked : value
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <img src="/img/icon_144.png" alt="Login Icon" className={styles.loginIcon} />
          <h1>Welcome!!</h1>
        </div>
        <div className={styles.header}>
          <p>로켓센터 시그널에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <Input
              size="large"
              name="userId"
              placeholder="아이디"
              prefix={<UserOutlined />}
              value={formData.userId}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <Input.Password
              size="large"
              name="password"
              placeholder="비밀번호"
              prefix={<LockOutlined />}
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className={styles.options}>
            <Checkbox
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
            >
              아이디 저장
            </Checkbox>
            <Link href="/login/findPassword" className={styles.forgotPassword}>
              비밀번호 찾기
            </Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className={styles.loginButton}
            block
          >
            로그인
          </Button>

          <div className={styles.footer}>
            <p>아직 계정이 없으신가요? <Link href="/signup">회원가입</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}
