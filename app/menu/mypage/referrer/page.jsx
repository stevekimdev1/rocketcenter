'use client';
import { useState, useEffect } from 'react';
import { Card, Pagination, Empty, Spin, App, Button } from 'antd';
import { UserOutlined, DollarOutlined, GiftOutlined, CalendarOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import styles from '@/src/css/referrer.module.css';
import httpClient from "@/src/lib/util/httpclient";
import { urls } from "@/src/const";
import { useRouter } from 'next/navigation';

export default function ReferrerHistory() {
  const { message } = App.useApp();
  const router = useRouter();
  const [referrals, setReferrals] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchReferrals = async (page = 1) => {
    try {
      setLoading(true);
      const response = await httpClient.get(`${urls.referrerHistory}?pageNum=${page}&pageSize=${pagination.pageSize}`);
      setReferrals(response.data.list);
      setPagination({
        ...pagination,
        current: response.data.currentPage,
        total: response.data.totalCount
      });
    } catch (error) {
      console.error('추천 내역 조회 중 오류 발생:', error);
      message.error('추천 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handlePageChange = (page) => {
    fetchReferrals(page);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/menu/mypage')}
            className={styles.backButton}
            shape="circle"
          />
          <h1>추천내역</h1>
        </div>
        
        {referrals.length > 0 ? (
          <>
            <div className={styles.cardGrid}>
              {referrals.map((referral) => (
                <Card key={referral.paymentIdx} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div className={styles.userInfo}>
                      <UserOutlined className={styles.icon} />
                      <span>{referral.userName}</span>
                    </div>
                    
                    <div className={styles.date}>
                      <CalendarOutlined className={styles.icon} />
                      <span>{new Date(referral.approvedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className={styles.subscriptionInfo}>
                      <GiftOutlined className={styles.icon} />
                      <span>{referral.subscription}</span>
                    </div>
                    
                    <div className={styles.cardFooter}>
                      <div className={styles.amount}>
                        <DollarOutlined className={styles.icon} />
                        <span>결제금액: <strong>{referral.amount.toLocaleString()} USDT</strong></span>
                      </div>
                      <div className={styles.mileage}>
                        <span>적립포인트:</span>
                        <strong>{referral.referrerMileage.toLocaleString()} P</strong>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className={styles.pagination}>
              <Pagination
                current={pagination.current}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <Empty
            description="추천 내역이 없습니다"
            className={styles.empty}
          />
        )}
      </div>
    </div>
  );
}
