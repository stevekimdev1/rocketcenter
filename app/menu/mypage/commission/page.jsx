'use client';
import { useState, useEffect } from 'react';
import { Card, Pagination, Empty, Spin, App, Button } from 'antd';
import { UserOutlined, DollarOutlined, GiftOutlined, CalendarOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import styles from '@/src/css/referrer.module.css';
import httpClient from "@/src/lib/util/httpclient";
import { urls } from "@/src/const";
import { useRouter } from 'next/navigation';

export default function CommissionHistory() {
  const { message } = App.useApp();
  const router = useRouter();
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchCommissionHistory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await httpClient.get(`${urls.commissionHistory}?pageNum=${page}&pageSize=${pagination.pageSize}`);
      setCommissionHistory(response.data.list);
      setPagination({
        ...pagination,
        current: response.data.currentPage,
        total: response.data.totalCount
      });
    } catch (error) {
      console.error('수당 내역 조회 중 오류 발생:', error);
      message.error('수당 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionHistory();
  }, []);

  const handlePageChange = (page) => {
    fetchCommissionHistory(page);
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
          <h1>수당내역</h1>
        </div>
        
        {commissionHistory.length > 0 ? (
          <>
            <div className={styles.cardGrid}>
              {commissionHistory.map((commission) => (
                <Card key={commission.paymentIdx} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div className={styles.userInfo}>
                      <UserOutlined className={styles.icon} />
                      <span>{commission.userName}</span>
                    </div>
                    
                    <div className={styles.date}>
                      <CalendarOutlined className={styles.icon} />
                      <span>{new Date(commission.approvedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className={styles.subscriptionInfo}>
                      <GiftOutlined className={styles.icon} />
                      <span>{commission.subscription}</span>
                    </div>
                    
                    <div className={styles.cardFooter}>
                      <div className={styles.amount}>
                        <DollarOutlined className={styles.icon} />
                        <span>결제금액: <strong>{commission.paymentAmount.toLocaleString()} USDT</strong></span>
                      </div>
                      <div className={styles.mileage}>
                        <span>수당:</span>
                        <strong>{commission.balanceChange.toLocaleString()} USDT</strong>
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
            description="수당 내역이 없습니다"
            className={styles.empty}
          />
        )}
      </div>
    </div>
  );
}
