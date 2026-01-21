'use client';
import { useState, useEffect } from 'react';
import { Checkbox, Select, Spin, Input, Button, App, Modal } from 'antd';
import { CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useUser } from '@/src/context/UserContext';
import styles from '@/src/css/subscription.module.css';
import httpClient from "@/src/lib/util/httpclient";
import { urls } from "@/src/const";
import { comma } from "@/src/lib/util/numberUtil";

export default function Subscription() {
  const { message } = App.useApp();
  const [subscriptions, setSubscriptions] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const [useMileage, setUseMileage] = useState(false);
  const [mileageAmount, setMileageAmount] = useState(0);
  const [companyAddress, setCompanyAddress] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('USDT');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [companyAddressKrw, setCompanyAddressKrw] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsResponse, stocksResponse, periodsResponse, addressResponse, exchangeRateResponse, addressKrwResponse] = await Promise.all([
          httpClient.get(urls.subscriptionList),
          httpClient.get(urls.subscriptionStockList),
          httpClient.get(urls.subscriptionPeriodList),
          httpClient.get(urls.globalSettingItem.replace('%s', 'COMPANY_ADDRESS')),
          httpClient.get(urls.globalSettingItem.replace('%s', 'EXCHANGE_RATE')),
          httpClient.get(urls.globalSettingItem.replace('%s', 'COMPANY_ADDRESS_KRW'))
        ]);

        setSubscriptions(subsResponse.data);
        setStocks(stocksResponse.data);
        setPeriods(periodsResponse.data);
        setCompanyAddress(addressResponse.data.value);
        setExchangeRate(exchangeRateResponse.data.value);
        setCompanyAddressKrw(addressKrwResponse.data.value);
      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, []);

  const calculateTotalPrice = () => {
    if (!selectedStocks.length || !selectedPeriod) return 0;

    return subscriptions
      .filter(sub => selectedStocks.includes(sub.stockCode) && sub.periodCode === selectedPeriod)
      .reduce((sum, sub) => sum + sub.price * (1 - sub.discountRate / 100), 0);
  };
  const calculateTotalOrgPrice = () => {
    if (!selectedStocks.length || !selectedPeriod) return 0;

    return subscriptions
      .filter(sub => selectedStocks.includes(sub.stockCode) && sub.periodCode === selectedPeriod)
      .reduce((sum, sub) => sum + sub.price, 0);
  };

  const totalOrgPrice = calculateTotalOrgPrice();
  const totalPrice = calculateTotalPrice().toFixed(0);
  const tetherPayment = Math.max(0, totalPrice - (useMileage ? mileageAmount : 0));

  const handleMileageChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    const maxMileage = Math.min(user?.mileage || 0, totalPrice);
    setMileageAmount(Math.min(value, maxMileage));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(companyAddress);
      message.success('주소가 복사되었습니다.');
    } catch (err) {
      message.error('주소 복사에 실패했습니다.');
    }
  };

  const handleSubscribe = async () => {
    if (!selectedStocks.length || !selectedPeriod) {
      message.warning('구독 상품과 기간을 선택해주세요.');
      return;
    }

    if (selectedPayment !== 'KRW' && selectedPayment !== 'USDT') {
      message.warning('결제 수단을 선택해주세요 (KRW 또는 USDT)');
      return;
    }

    try {
      const response = await httpClient.post(urls.subscriptionCreate, {
        stockCodeList: selectedStocks,
        periodCode: selectedPeriod,
        mileage: useMileage ? mileageAmount : 0,
        method: selectedPayment,
        krwAmount: Math.floor(tetherPayment * exchangeRate * 1.1)
      });

      switch (response.data) {
        case 'SUCCESS':
          message.success('구독 신청이 완료되었습니다. 코인 입금 후 입금확인 게시판에 글을 작성해주세요. 처리상태는 내정보에서 확인하실 수 있습니다.');
          // 폼 초기화
          setSelectedStocks([]);
          setSelectedPeriod(null);
          setUseMileage(false);
          setMileageAmount(0);
          // 성공 모달 표시
          setSuccessModalVisible(true);
          break;
        case 'NO_MILEAGE':
          message.error('적립포인트가 부족합니다.');
          break;
        case 'INVALID_CODE':
          message.error('유효하지 않은 상품 코드입니다.');
          break;
        case 'ALREADY_REQUEST':
          message.error('이미 처리 대기중인 구독 신청이 있습니다.');
          break;
        default:
          message.error('구독 신청에 실패했습니다.');
      }
    } catch (error) {
      message.error('구독 신청 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles.menuSubscriptionRoot}`}>
      <div className={styles.content}>
        <div className={styles.planContainer}>
          <h2 className={styles.planTitle}>구독플랜</h2>
          <div className={styles.planGrid}>
            <div className={styles.planCard}>
              <div className={styles.planCardTitle}>
                <div className={styles.planCardTitleIcon}>
                  <img src="/img/subscribe/subscribe_coin.png" alt="Coin Icon" />
                </div>
                <div className={styles.planCardTitleText}>
                  코인선물<br/>
                  <span className={styles.planCardTitleDescription}>Crypto Futures</span>
                </div>
              </div>
              <div className={styles.planCardPrice1}>
                US$420 / 14일<br />
                <span className={styles.planCardDescription}>가상화폐 10종목</span>
              </div>
              <div className={styles.planCardPrice2}>
                <span className={styles.planCardOrgPrice}>US$840 / 28일</span><br />
                US$672 / 28일<br />
                <span className={styles.planCardDescription}>가상화폐 10종목</span><br />
                <span className={styles.planCardDiscount}>20% DC</span>
              </div>
            </div>
            {/* <div className={styles.planCard}>
              <div className={styles.planCardTitle}>
                <div className={styles.planCardTitleIcon}>
                  <img src="/img/subscribe/subscribe_mat.png" alt="Coin Icon" />
                </div>
                <div className={styles.planCardTitleText}>
                  원자재선물<br/>
                  <span className={styles.planCardTitleDescription}>Commodity Futures</span>
                </div>
              </div>
              <div className={styles.planCardPrice1}>
                US$570 / 14일<br />
                <span className={styles.planCardDescription}>골드, 실버, 원유</span>
              </div>
              <div className={styles.planCardPrice2}>
                <span className={styles.planCardOrgPrice}>US$1,036 / 28일</span><br />
                US$828 / 28일<br />
                <span className={styles.planCardDescription}>골드, 실버, 원유</span><br />
                <span className={styles.planCardDiscount}>20% DC</span>
              </div>
            </div>
            <div className={styles.planCard}>
              <div className={styles.planCardTitle}>
                <div className={styles.planCardTitleIcon}>
                  <img src="/img/subscribe/subscribe_index.png" alt="Coin Icon" />
                </div>
                <div className={styles.planCardTitleText}>
                  지수선물<br/>
                  <span className={styles.planCardTitleDescription}>Index Futures</span>
                </div>
              </div>
              <div className={styles.planCardPrice1}>
                US$630 / 14일<br />
                <span className={styles.planCardDescription}>나스닥100, S&P500, 항생</span>
              </div>
              <div className={styles.planCardPrice2}>
                <span className={styles.planCardOrgPrice}>US$1,260 / 28일</span><br />
                US$1,008 / 28일<br />
                <span className={styles.planCardDescription}>나스닥100, S&P500, 항생</span><br />
                <span className={styles.planCardDiscount}>20% DC</span>
              </div>
            </div> */}
          </div>
        </div>
        <div className={styles.selectionArea}>

          <div className={styles.stockSelection}>
            <h2>구독 상품 선택</h2>
            <Checkbox.Group
              className={styles.stockCheckboxGroup}
              onChange={setSelectedStocks}
              value={selectedStocks}
            >
              {stocks.map(stock => (
                <Checkbox
                  key={stock.stockCode}
                  value={stock.stockCode}
                  className={styles.stockCheckbox}
                >
                  {stock.stockName}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>

          <div className={styles.periodSelection}>
            <h2>구독 기간 선택</h2>
            <Select
              className={styles.periodSelect}
              placeholder="구독 기간을 선택해주세요"
              onChange={setSelectedPeriod}
              value={selectedPeriod}
            >
              {periods.map(period => (
                <Select.Option
                  key={period.periodCode}
                  value={period.periodCode}
                >
                  {period.periodName}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.summaryArea}>
          <div className={styles.summaryRow}>
            <label>구독 상품</label>
            <div className={styles.summaryValue}>
              {selectedStocks.length > 0
                ? stocks
                  .filter(stock => selectedStocks.includes(stock.stockCode))
                  .map(stock => stock.stockName)
                  .join(', ')
                : '-'
              }
            </div>
          </div>

          <div className={styles.summaryRow}>
            <label>구독 기간</label>
            <div className={styles.summaryValue}>
              {selectedPeriod
                ? periods.find(p => p.periodCode === selectedPeriod)?.periodName
                : '-'
              }
            </div>
          </div>

          <div className={styles.summaryRow}>
            <label>구독총결제</label>
            <div className={styles.summaryValue} style={{ textDecoration: 'line-through' }}>
              {totalOrgPrice > 0 ? `${totalOrgPrice} USDT` : '-'}
            </div>
          </div>

          <div className={styles.summaryRow}>
            <label>할인후결제</label>
            <div className={styles.summaryValue}>
              {totalPrice > 0 ? `${totalPrice} USDT` : '-'}
            </div>
          </div>

          <span className={styles.mileageBalanceMobile}>
            (내 잔고: {user?.mileage || 0} P)
          </span>
          <div className={`${styles.summaryRow} ${styles.summaryRowMileage}`}>
            <label>
              적립포인트 사용
              <span className={styles.mileageBalance}>
                (내 잔고: {user?.mileage || 0} P)
              </span>
            </label>
            <div className={styles.mileageInput}>
              <Checkbox
                checked={useMileage}
                onChange={(e) => {
                  setUseMileage(e.target.checked);
                  if (!e.target.checked) setMileageAmount(0);
                }}
              />
              {useMileage && (
                <Input
                  type="number"
                  value={mileageAmount}
                  onChange={handleMileageChange}
                  max={Math.min(user?.mileage || 0, totalPrice)}
                  min={0}
                  suffix="P"
                />
              )}
            </div>
          </div>

          <div className={styles.summaryRow}>
            <label>최종결제금액</label>
            <div className={styles.summaryValue}>
              {tetherPayment > 0 ? `${tetherPayment} USDT` : '-'}
            </div>
          </div>
        </div>

        <div className={styles.depositArea}>
          <h2>입금 정보</h2>

          <div className={styles.depositInfo}>
            <div className={styles.infoRow}>
              <div className={styles.infoValue}>
                <img src="/img/tether.png" alt="Tether Icon" className={styles.tetherIcon} />
                <span>테더(USDT)</span>
              </div>
              <div className={styles.infoValue}>
                <div className={styles.flex1}>{tetherPayment > 0 ? `${comma(tetherPayment)} USDT` : '-'}</div>
                <Button
                  onClick={() => setSelectedPayment('USDT')}
                  className={styles.selectButton}
                  disabled={selectedPayment === 'USDT'}
                >
                  선택
                </Button>
              </div>
            </div>
            {selectedPayment === 'USDT' && (
              <>
                <div className={styles.infoRow}>
                  <label>네트워크</label>
                  <div className={styles.infoValue}>TRC20</div>
                </div>
                <div className={styles.infoRow}>
                  <label>지갑주소</label>
                  <div className={styles.addressWrapper}>
                    <div className={styles.address}>{companyAddress}</div>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={handleCopy}
                      className={styles.copyButton}
                    >
                      복사하기
                    </Button>
                  </div>
                </div>
                <div className={styles.qrWrapper}>
                  <QRCodeSVG
                    value={companyAddress}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </>
            )}
          </div>

          {/* <div className={styles.depositInfo}>
            <div className={styles.infoRow}>
              <div className={styles.infoValue}>
                <img src="/img/krw.png" alt="KRW Icon" className={styles.tetherIcon} />
                <span>원화(KRW)</span>
              </div>
              <div className={styles.infoValue}>
                <div className={styles.flex1}>{tetherPayment > 0 ? `${comma(Math.floor(tetherPayment * exchangeRate * 1.1))} KRW` : '-'}</div>
                <Button
                  onClick={() => setSelectedPayment('KRW')}
                  className={styles.selectButton}
                  disabled={selectedPayment === 'KRW'}
                >
                  선택
                </Button>
              </div>
            </div>
            {selectedPayment === 'KRW' && (
              <>
                <div className={styles.infoRow}>
                  <label>계좌번호</label>
                  <div className={styles.infoValue}>{companyAddressKrw}</div>
                </div>
                <div className={styles.infoRow}>
                  * 최종결제금액에 환율 및 VAT 적용
                </div>
              </>
            )}
          </div> */}


          <div className={styles.depositNotice}>
            입금 후 고객센터 게시판 입금확인 요청 남겨주세요
          </div>
          <div className={styles.depositNoticeDetail}>
            ①입금확인 후 구독승인이 이뤄지며 승인시점부터 구독기간이 적용됩니다.<br />
            ②원화결제의 경우 3시간이내 입금확인 안될시 구독취소되며 재신청이 필요합니다.<br />
            ③구독해지는 서비스개시일로부터 14일이내 가능하며 서비스 사용일 기준 계산되어 공제 후 환불됩니다.
          </div>
        </div>

        <div className={styles.subscribeArea}>
          <Button
            type="primary"
            size="large"
            onClick={handleSubscribe}
            className={styles.subscribeButton}
            disabled={!selectedStocks.length || !selectedPeriod}
          >
            구독 신청
          </Button>
        </div>

        <Modal
          title={
            <div className={styles.successModalTitle}>
              <CheckCircleOutlined className={styles.successIcon} />
              <span>구독 신청 완료</span>
            </div>
          }
          open={successModalVisible}
          onOk={() => setSuccessModalVisible(false)}
          onCancel={() => setSuccessModalVisible(false)}
          centered
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => setSuccessModalVisible(false)}
              className={styles.successModalButton}
            >
              확인
            </Button>
          ]}
        >
          <div className={styles.successModalContent}>
            <p>구독 신청이 완료되었습니다.</p>
            <p className={styles.highlightText}>코인 입금 후 입금확인 게시판에 글을 작성해주세요.</p>
            <p>처리상태는 내정보에서 확인하실 수 있습니다.</p>
          </div>
        </Modal>
      </div>
    </div>
  );
}
