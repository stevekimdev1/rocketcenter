"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import httpClient from "@/src/lib/util/httpclient";
import { mainUrl, urls } from "@/src/const";
import util from 'util';
import styles from '@/src/css/mailVerify.module.css';

export default function MailVerify({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [status, setStatus] = useState('verifying');

  async function fetchData() {
    try {
      const verifyUrl = util.format(urls.mailVerify, resolvedParams.token);
      const response = await httpClient.post(verifyUrl, {});
      if (response.data) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  }

  useEffect(() => {
    fetchData();
  }, [resolvedParams.token]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>RocketCenter</h1>
      {status === 'verifying' && (
        <p className={styles.loading}>인증 진행 중...</p>
      )}
      {status === 'success' && (
        <>
          <p className={`${styles.message} ${styles.success}`}>
            이메일 인증이 완료되었습니다.<br />
            로그인하여 서비스를 이용해주세요.
          </p>
          <button 
            className={styles.button}
            onClick={() => router.push('/login')}
          >
            로그인하기
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className={`${styles.message} ${styles.error}`}>
            인증에 실패하였습니다.<br />다시 인증해주세요.
          </p>
          {/* <button 
            className={styles.button}
            onClick={() => router.push('/signup')}
          >
            회원가입으로 돌아가기
          </button> */}
        </>
      )}
    </div>
  );
}