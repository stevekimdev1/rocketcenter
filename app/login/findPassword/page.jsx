'use client'
import { Form, Input, Modal, App } from "antd";
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import httpClient from "@/src/lib/util/httpclient";
import { urls } from "@/src/const";
import { useRouter } from 'next/navigation';
import styles from '@/src/css/findPassword.module.css';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function FindPassword() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [timer, setTimer] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { message, modal } = App.useApp();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isSent) {
      setIsSent(false);
      setIsVerified(false);
    }
    return () => clearInterval(interval);
  }, [timer, isSent]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    try {
      await form.validateFields(['email']);
      const email = form.getFieldValue('email');
      
      const response = await httpClient.post(urls.emailCodeDispatch, {
        email: email,
        checkUser: true,
      });

      if (response.data.result === 'INVALID_EMAIL_FORMAT') {
        modal.error({
          title: '이메일 형식 오류',
          content: '올바른 이메일 형식이 아닙니다.',
        });
      }
      if (response.data.result === 'USER_NOT_FOUND') {
        modal.error({
          title: '사용자 없음',
          content: '등록되지 않은 이메일입니다.',
        });
      }
      if (response.data.result === 'RECENTLY_SENT') {
        modal.error({
          title: '재전송 제한',
          content: '최근에 발송된 인증메일이 있습니다. 잠시 후 다시 시도해주세요.',
        });
      }
      form.setFieldValue('token', response.data.token); // 토큰 저장

      setTimer(300); // 5분
      setIsSent(true);
    } catch (error) {
    }
  };

  const handleVerifyCode = async () => {
    try {
      await form.validateFields(['verificationCode']);
      const code = form.getFieldValue('verificationCode');
      const token = form.getFieldValue('token');
      const response = await httpClient.get(urls.emailCodeVerify.replace('%s', token).replace('%s', code));
      if (response.data === 'INVALID') {
        modal.error({
          title: '인증코드 오류',
          content: '인증코드가 올바르지 않습니다.',
        });
        return;
      }
      if (response.data === 'EXPIRED') {
        modal.error({
          title: '인증코드 만료',
          content: '인증코드가 만료되었습니다.',
        });
        return;
      }
      setIsVerified(true);
    } catch (error) {
    }
  };

  const onFinish = async (values) => {
    if (!isVerified) {
      form.setFields([{
        name: 'verificationCode',
        errors: ['인증이 필요합니다']
      }]);
      return;
    }
    try {
      const response = await httpClient.post(urls.findPassword, {
        email: form.getFieldValue('email'),
        token: form.getFieldValue('token'),
        code: form.getFieldValue('verificationCode'),
        newPassword: values.newPassword,
      });
      if (response.data === 'SUCCESS') {
        modal.success({
          title: '비밀번호 변경 완료',
          content: '비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.',
          onOk: () => router.push('/login')
        });
        return;
      }

      const modalConfig = {
        title: '비밀번호 변경 실패',
        content: ''
      };

      switch (response.data) {
        case 'USER_NOT_FOUND':
          modalConfig.content = '사용자를 찾을 수 없습니다.';
          break;
        case 'INVALID_PASSWORD_FORMAT':
          modalConfig.content = '비밀번호 형식이 올바르지 않습니다.';
          break;
        case 'EXPIRED':
          modalConfig.content = '인증이 만료되었습니다. 다시 시도해주세요.';
          break;
        case 'INVALID_CODE':
          modalConfig.content = '인증코드가 올바르지 않습니다.';
          break;
        default:
          modalConfig.content = '비밀번호 변경 중 오류가 발생했습니다.';
      }

      modal.error(modalConfig);
    } catch (error) {
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.findPasswordBox}>
        <div className={styles.header}>
          <h1>비밀번호 찾기</h1>
          <p>가입하신 이메일로 인증 후 비밀번호를 변경하실 수 있습니다.</p>
        </div>

        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          className={styles.form}
        >
          <div className={styles.formItem}>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '이메일을 입력해주세요' },
                { type: 'email', message: '올바른 이메일 형식이 아닙니다' }
              ]}
            >
              <Input 
                placeholder="이메일을 입력해주세요" 
                prefix={<UserOutlined />}
                disabled={isVerified}
              />
            </Form.Item>

            <Form.Item
              name="verificationCode"
              rules={[
                { required: true, message: '인증코드를 입력해주세요' }
              ]}
            >
              <div className={styles.inputWithButton}>
                <Input
                  placeholder="인증코드 6자리를 입력해주세요"
                  prefix={<SafetyCertificateOutlined />}
                  disabled={isVerified}
                />
                {!isSent ? (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className={styles.verificationButton}
                  >
                    인증코드받기
                  </button>
                ) : isVerified ? (
                  <span className={styles.verificationStatus}>
                    인증완료 ({formatTime(timer)})
                  </span>
                ) : timer === 0 ? (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className={styles.verificationButton}
                  >
                    재전송
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      className={styles.verificationButton}
                    >
                      코드확인
                    </button>
                    <span className={styles.timer} style={{zIndex: 1000}}>({formatTime(timer)})</span>
                  </>
                )}
              </div>
            </Form.Item>

            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: '새 비밀번호를 입력해주세요' },
                { 
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^])[A-Za-z\d@$!%*#?&^]{8,15}$/,
                  message: '8-15자의 영문, 숫자, 특수문자를 포함해야 합니다'
                }
              ]}
            >
              <Input.Password 
                placeholder="새 비밀번호 (8-15자의 영문, 숫자, 특수문자 조합)"
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Form.Item
              name="confirmNewPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '새 비밀번호를 다시 입력해주세요' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('비밀번호가 일치하지 않습니다'));
                  },
                }),
              ]}
            >
              <Input.Password 
                placeholder="새 비밀번호 확인"
                prefix={<LockOutlined />}
              />
            </Form.Item>
          </div>

          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.submitButton}>
              비밀번호 변경
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
