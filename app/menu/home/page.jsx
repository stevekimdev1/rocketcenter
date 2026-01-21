'use client';
import { useState, useEffect } from 'react';
import { Carousel } from 'antd';
import Link from 'next/link';
import styles from '@/src/css/home.module.css';
import { Helmet } from 'react-helmet';
import dynamic from "next/dynamic";
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function Home() {
    useEffect(() => {
        AOS.init();
    }, []);
    const carouselData = [
        {
            title: "Win the Market with Real-Time Signals Investment Insight",
            subtitle: "실시간 신호로 시장을 이기세요.",
            description: "로켓센터 신호차트로 정확하고 신속한 투자 결정을 내리세요. 실시간 신호로 시장의 변화에 적극 대응하세요."
        },
        {
            title: "Master the Market with Real-Time Signals",
            subtitle: "실시간 신호로 시장을 지배하세요",
            description: "로켓센터 신호차트로 통찰력 있는 투자 결정을 내리세요. 실시간 신호를 통해 시장의 변동에 앞서 나가세요."
        },
        {
            title: "Enhance Your Investment Insight",
            subtitle: "투자의 통찰력을 높여드립니다.",
            description: "정확한 데이터와 분석으로 투자 결정을 강화하세요.로켓센터 신호차트는 신뢰할 수 있는 투자 파트너가 되어 드리겠습니다."
        }
    ];
    const TickerTapeNoSSR = dynamic(
        () => import("react-ts-tradingview-widgets").then((w) => w.TickerTape),
        {
            ssr: false,
        }
    );

    return (
        <div className={`${styles.container} ${styles.menuHomeRoot}`}>
            <Carousel autoplay className={styles.carousel} autoplaySpeed={5000}>
                {carouselData.map((slide, index) => (
                    <div key={index} className={`${styles.slide} ${styles[`slide${index + 1}`]}`}>
                        <div className={styles.content}>
                            <h1 className={styles.title}>{slide.title}</h1>
                            <h2 className={styles.subtitle}>{slide.subtitle}</h2>
                            <p className={styles.description}>{slide.description}</p>
                            <Link href="/menu/subscription" className={styles.signupButton}>
                                구독하기
                            </Link>
                        </div>
                    </div>
                ))}
            </Carousel>
            <TickerTapeNoSSR
                symbols={ [
                    {
                        proName: "FOREXCOM:SPXUSD",
                        title: "S&P 500 Index"
                    },
                    {
                        proName: "FOREXCOM:NSXUSD",
                        title: "US 100 Cash CFD"
                    },
                    {
                        proName: "FX_IDC:EURUSD",
                        title: "EUR to USD"
                    },
                    {
                        proName: "BITSTAMP:BTCUSD",
                        title: "Bitcoin"
                    },
                    {
                        proName: "BITSTAMP:ETHUSD",
                        title: "Ethereum"
                    }
                  ]}
            />
            <div className={styles.infoSection}>
                <div className={styles.infoRow} data-aos="fade-right" data-aos-duration="1000">
                    <div className={styles.infoImage}>
                        <img src="/img/home/sub_img1.png" alt="Unlock Financial Success" />
                    </div>
                    <div className={styles.infoContent}>
                        <div className={styles.infoTitle}>
                            Unlock Financial Success
                        </div>
                        <div className={styles.infoSubtitle}>
                            Signal Charts for Smart Trading
                        </div>
                        <div className={styles.infoDescription}>
                            로켓센터 신호차트로 트레이딩 방식을 스마트하게 업그레이드하세요. <br/>
                            정확한 실시간 신호로 추세예측과 함께 여러분의 매매 타이밍을 안내하여 항상 시장보다 한발 앞서 나갈 수 있습니다.<br/>
                            많은 개인 트레이더들이 거래의 통찰력을 얻기 위해 로켓센터를 활용하고 있습니다.
                        </div>
                    </div>
                </div>

                <div className={styles.infoRow} data-aos="fade-left" data-aos-duration="1000">
                    <div className={styles.infoContent}>
                        <div className={styles.infoTitle}>
                            Navigator of Trading
                        </div>
                        <div className={styles.infoSubtitle}>
                            With 70+Strategic Techniques
                        </div>
                        <div className={styles.infoDescription}>
                            로켓센터 신호차트는 70가지 이상의 전략 매매기법과 노하우를 제공합니다. <br/>
                            각종 시장 상황에서 트레이딩 가이드로서 확실한 방향을 제시합니다.
                        </div>
                    </div>
                    <div className={styles.infoImage}>
                        <img src="/img/home/sub_img2.png" alt="Navigator of Trading" />
                    </div>
                </div>

                <div className={styles.infoRow} data-aos="fade-right" data-aos-duration="1000">
                    <div className={styles.infoImage}>
                        <img src="/img/home/sub_img3.png" alt="Trading Confidence" />
                    </div>
                    <div className={styles.infoContent}>
                        <div className={styles.infoTitle}>
                            Trading Confidence
                        </div>
                        <div className={styles.infoSubtitle}>
                            Real-Time Signals
                        </div>
                        <div className={styles.infoDescription}>
                            불확실성은 이제 그만, 자신감 있는 트레이딩을 시작하세요.<br/>
                            실시간 로켓센터 신호차트가 정확 매매타이밍을 제공하여 여러분의 고민을 덜어드리고 신속한 결정을 내릴 수 있도록 도와드립니다. <br/>
                            초보자든 경험 많은 트레이더든, 우리의 플랫폼은 여러분의 거래 실력을 향상시킬 도구를 제공합니다.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
