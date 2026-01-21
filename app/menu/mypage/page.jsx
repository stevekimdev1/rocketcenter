'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Form, Input, message, App, Table, Tag, Card } from 'antd';
import { CopyOutlined, LockOutlined } from '@ant-design/icons';
import styles from '@/src/css/mypage.module.css';
import { useUser } from '@/src/context/UserContext';
import httpClient from "@/src/lib/util/httpclient";
import { urls, storageKeys } from "@/src/const";
import moment from 'moment';
export default function MyPage() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [referralUrl, setReferralUrl] = useState('');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('복사되었습니다.');
    });
  };

  const handlePasswordChange = async (values) => {
    try {
      const response = await httpClient.post(urls.modifyPassword, {
        password: values.currentPassword,
        newPassword: values.newPassword
      });

      switch (response.data) {
        case 'SUCCESS':
          message.success('비밀번호가 변경되었습니다.');
          setIsPasswordModalVisible(false);
          form.resetFields();
          break;
        case 'INVALID_PASSWORD':
          message.error('현재 비밀번호가 일치하지 않습니다.');
          break;
        case 'INVALID_PASSWORD_FORMAT':
          message.error('새 비밀번호는 8~15자의 영문, 숫자, 특수문자 조합이어야 합니다.');
          break;
        case 'FAIL':
          message.error('비밀번호 변경 중 오류가 발생했습니다.');
          break;
        default:
          message.error('알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      message.error('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  const handleWithdraw = async (values) => {
    try {
      const response = await httpClient.post(urls.withdraw, {
        password: values.password
      });

      switch (response.data) {
        case 'SUCCESS':
          message.success('회원 탈퇴가 완료되었습니다.');
          localStorage.removeItem(storageKeys.accessToken);
          localStorage.removeItem(storageKeys.refreshToken);
          localStorage.removeItem(storageKeys.user);
          setUser(null);
          router.push('/');
          break;
        case 'INVALID_PASSWORD':
          message.error('비밀번호가 일치하지 않습니다.');
          break;
        case 'FAIL':
          message.error('회원 탈퇴 처리 중 오류가 발생했습니다.');
          break;
        default:
          message.error('알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.log(error);
      message.error('회원 탈퇴 중 오류가 발생했습니다.');
    }
  };

  const fetchPaymentHistory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await httpClient.get(urls.paymentHistory.replace('%s', page).replace('%s', 5));
      setPaymentHistory(response.data.list);
      setPagination({
        ...pagination,
        current: response.data.currentPage,
        total: response.data.totalCount
      });
    } catch (error) {
      console.error('결제 내역 조회 중 오류 발생:', error);
      message.error('결제 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    if (user?.referralCode) {
      setReferralUrl(`${window.location.origin}/signup?ref=${user.referralCode}`);
    }
  }, [user?.referralCode]);

  const handleTableChange = (pagination) => {
    fetchPaymentHistory(pagination.current);
  };

  const handleCancelPayment = async (paymentIdx) => {
    try {
      modal.confirm({
        title: '결제 취소',
        content: '결제를 취소하시겠습니까?',
        okText: '확인',
        cancelText: '취소',
        async onOk() {
          const response = await httpClient.post(urls.paymentCancel.replace('%s', paymentIdx));
          switch (response.data) {
            case 'SUCCESS':
              message.success('결제가 취소되었습니다.');
              fetchPaymentHistory();
              break;
            case 'NOT_CANCELABLE':
              message.error('취소할 수 없는 결제입니다.');
              break;
            case 'FAIL':
              message.error('결제 취소에 실패했습니다.');
              break;
          }
        }
      });
    } catch (error) {
      console.log(error);
      message.error('결제 취소 중 오류가 발생했습니다.');
    }
  };

  const columns = [
    {
      title: '신청일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: (text) => text ? new Date(text).toLocaleDateString() : '-'
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => {
        let color;
        let text;
        switch (status) {
          case 'COMPLETE':
            color = 'green';
            text = '승인';
            break;
          case 'REQUEST':
            color = 'blue';
            text = '미승인';
            break;
          default:
            color = 'red';
            text = '취소';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '구독상품',
      dataIndex: 'subscription',
      key: 'subscription',
      align: 'center',
      render: (subscription) => subscription?.split(',').map((item, index) => <p key={index}>{item}</p>)
    },
    {
      title: '결제금액',
      dataIndex: 'amount',
      key: 'amount',
      align: 'center',
      render: (amount) => `${amount.toLocaleString()} USDT`
    },
    {
      title: '구독만료',
      dataIndex: 'subscriptionEndDate',
      key: 'subscriptionEndDate',
      align: 'center',
      render: (subscriptionEndDate) => subscriptionEndDate?.split(',').map((item, idx) => {
        const formattedDate = moment(item).subtract(1, 'days').format('YYYY.MM.DD');
        return <p key={idx}>{formattedDate}</p>;
      })
    },
    {
      title: '승인',
      dataIndex: 'approvedAt',
      key: 'approvedAt',
      align: 'center',
      render: (text) => text ? new Date(text).toLocaleDateString() : '-'
    },
    {
      title: '취소',
      dataIndex: 'canceledAt',
      key: 'canceledAt',
      align: 'center',
      render: (text, record) => {
        if (text) {
          return new Date(text).toLocaleDateString();
        }
        if (record.status === 'REQUEST') {
          return (
            <Button
              type="link"
              danger
              onClick={() => handleCancelPayment(record.paymentIdx)}
            >
              취소하기
            </Button>
          );
        }
        return '-';
      }
    }
  ];

  return (
    <div className={`${styles.container} ${styles.menuMyPageRoot}`}>
      <div className={styles.content}>
        <h1>내 정보</h1>

        <section className={styles.section}>
          <h2>기본 정보</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>아이디</label>
              <span>{user?.userId}</span>
            </div>
            <div className={styles.infoItem}>
              <label>이름</label>
              <span>{user?.isSeller ? <span className={styles.seller}>셀러</span> : ''}{user?.name}</span>
            </div>
            <div className={styles.infoItem}>
              <label>전화번호</label>
              <span>{user?.phone}</span>
            </div>
            <div className={styles.infoItem}>
              <label>가입일</label>
              <span>{new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => setIsPasswordModalVisible(true)}
            className={styles.passwordButton}
          >
            비밀번호 변경
          </Button>
        </section>

        <section className={styles.section}>
          <h2>추천 정보</h2>
          <div className={styles.referralInfo}>
            <div className={styles.infoItem}>
              <label>추천 코드</label>
              <div className={styles.copyWrapper}>
                <span>{user?.referralCode}</span>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(user?.referralCode)}
                >
                  복사
                </Button>
              </div>
            </div>
            <div className={styles.infoItem}>
              <label>추천 링크</label>
              <div className={styles.copyWrapper}>
                <span>{referralUrl}</span>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(referralUrl)}
                >
                  복사
                </Button>
              </div>
            </div>
          </div>
            <Button
              type="primary"
              onClick={() => router.push('/menu/mypage/referrer')}
              className={styles.referralButton}
            >
              추천내역보기
            </Button>
          {user?.isSeller && (
            <Button
              type="primary"
              onClick={() => router.push('/menu/mypage/commission')}
              className={styles.referralButton}
              style={{marginLeft: '10px'}}
            >
              수당내역조회
            </Button>
          )}
        </section>

        <section className={styles.section}>
          <h2>구독 정보</h2>
          <div className={styles.subscriptionInfo}>
            <Table
              columns={columns}
              dataSource={paymentHistory}
              pagination={pagination}
              onChange={handleTableChange}
              loading={loading}
              rowKey="paymentIdx"
              className={styles.paymentTable}
            />
          </div>
          <div className={styles.subscriptionInfoMobile}>
            {paymentHistory.map((payment) => (
              <Card key={payment.paymentIdx} className={styles.mobileCard}>
                <div className={styles.mobileCardContent}>
                  <div className={styles.mobileCardRow}>
                    신청일: <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {
                    <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                      {payment.subscription?.split(',').map((item, index) => (
                        <li key={index} className={styles.mobileCardRow}>• {item}</li>
                      ))}
                    </ul>
                  }
                  <div className={styles.mobileCardRow}>
                    금액: <span>{payment.amount.toLocaleString()} USDT ({payment.mileageAmount.toLocaleString()} P)</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    {payment.status === 'COMPLETE' ? (
                      <span>{new Date(payment.approvedAt).toLocaleDateString()}</span>
                    ) : payment.status === 'CANCELED' ? (
                      <span>{new Date(payment.canceledAt).toLocaleDateString()}</span>
                    ) : (
                      <Button
                        danger
                        onClick={() => handleCancelPayment(payment.paymentIdx)}
                        size="small"
                      >
                        취소하기
                      </Button>
                    )}
                    <Tag color={
                      payment.status === 'COMPLETE' ? 'green' :
                        payment.status === 'REQUEST' ? 'blue' : 'red'
                    }>
                      {payment.status === 'COMPLETE' ? '승인' :
                        payment.status === 'REQUEST' ? '미승인' : '취소'}
                    </Tag>
                  </div>
                  <div className={styles.mobileCardRow} >
                    {payment.status === 'COMPLETE' && (

                      <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                        {payment.subscriptionEndDate?.split(',').map((item, index) => (
                          <li key={index} className={styles.mobileCardRow}>• 만료예정: {moment(item).subtract(1, 'days').format('YYYY.MM.DD')}</li>
                        ))}
                      </ul>
                    )}
                    </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className={styles.withdrawSection}>
          <Button danger onClick={() => setIsWithdrawModalVisible(true)}>
            회원 탈퇴
          </Button>
        </div>
      </div>

      <Modal
        title="비밀번호 변경"
        open={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={420}
      >
        <Form
          form={form}
          onFinish={handlePasswordChange}
          layout="vertical"
        >
          <Form.Item
            name="currentPassword"
            rules={[{ required: true, message: '현재 비밀번호를 입력해주세요' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="현재 비밀번호"
              size="large"
              className={styles.input}
            />
          </Form.Item>
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: '새 비밀번호를 입력해주세요' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^])[A-Za-z\d@$!%*#?&^]{8,15}$/,
                message: '8~15자의 영문, 숫자, 특수문자를 조합해주세요'
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="새 비밀번호 (8~15자의 영문, 숫자, 특수문자 조합)"
              size="large"
              className={styles.input}
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
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
              prefix={<LockOutlined />}
              placeholder="새 비밀번호 확인"
              size="large"
              className={styles.input}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              변경하기
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="회원 탈퇴"
        open={isWithdrawModalVisible}
        onCancel={() => {
          setIsWithdrawModalVisible(false);
          withdrawForm.resetFields();
        }}
        footer={null}
        width={420}
      >
        <div className={styles.withdrawModalContent}>
          <p className={styles.withdrawWarning}>
            정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <Form
            form={withdrawForm}
            onFinish={handleWithdraw}
            layout="vertical"
          >
            <Form.Item
              name="password"
              rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="비밀번호를 입력해주세요"
                size="large"
                className={styles.input}
              />
            </Form.Item>
            <Form.Item>
              <Button danger type="primary" htmlType="submit" size="large" block>
                탈퇴하기
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
