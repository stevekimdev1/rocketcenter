"use client";

import "@ant-design/v5-patch-for-react-19";
import { App } from "antd";
import { useEffect, useState, useRef } from 'react';
import { connectWebSocket, disconnectWebSocket } from '@/src/lib/util/websocket';
import { useUser } from '@/src/context/UserContext';
import { storageKeys, mainUrl, urls } from '@/src/const';
import { useRouter } from 'next/navigation';
import httpClient from '@/src/lib/util/httpclient';
import axios from 'axios';

export default function ClientLayout({ children }) {
    const { user, setUser } = useUser();
    const [stompClient, setStompClient] = useState(null);
    const stompClientRef = useRef(null);
    const { message, modal } = App.useApp();
    const router = useRouter();

    useEffect(() => {

        console.log('#################### user changed - ', user);

        if (user !== null) {
            console.log('connectWebSocket..');
            connectWebSocket((client) => {
                console.log('on connectWebSocket..');
                setStompClient(client);
                stompClientRef.current = client;
                if (client && client.connected) {
                    const token = localStorage.getItem(storageKeys.accessToken);
                    const headers = {
                        'Authorization': `Bearer ${token}`
                    };

                    client.subscribe('/topic/alarm-data', handleMessage);
                    client.subscribe('/user/queue/alarm-data', handleMessage);
                    try {
                        if (user?.roles) {
                            user.roles.forEach(role => {
                                const topic = `/topic/signal/${role.toLowerCase()}`;
                                client.subscribe(topic, handleMessage, headers);
                                console.log('subscribe topic - ', topic);
                            });
                        }
                    } catch (error) {
                        console.error('WebSocket 구독 오류:', error);
                    }
                }
            });
        } else {
            console.log('disconnectWebSocket..');
            disconnectWebSocket();
        }
    }, [user]);

    const handleMessage = async (message) => {
        const alarmData = JSON.parse(message.body);
        console.log(alarmData);
        
        let content = message.body;
        switch(alarmData.category) {
            case 'PAYMENT_APPROVAL':
                content = '결제가 승인되었습니다.';

                const refreshResponse = await axios.post(urls.refresh, {
                    refreshToken: localStorage.getItem(storageKeys.refreshToken),
                });

                const newAccessToken = refreshResponse.data.accessToken;
                localStorage.setItem(storageKeys.accessToken, newAccessToken);

                console.log('newAccessToken - ', newAccessToken);
                httpClient.get(urls.myinfo)
                    .then(response => {
                        const userInfo = response.data;
                        try {
                            if (userInfo?.roles && stompClientRef.current) {
                                const prevRoles = user?.roles || [];
                                const newRoles = userInfo.roles;

                                // Unsubscribe removed roles
                                prevRoles.forEach(prevRole => {
                                    if (!newRoles.includes(prevRole)) {
                                        const topic = `/topic/signal/${prevRole.toLowerCase()}`;
                                        const headers = {
                                            'Authorization': `Bearer ${newAccessToken}`
                                        };
                                        stompClientRef.current.unsubscribe(topic, headers);
                                        console.log('unsubscribe topic - ', topic);
                                    }
                                });

                                // Subscribe new roles
                                newRoles.forEach(newRole => {
                                    if (!prevRoles.includes(newRole)) {
                                        const topic = `/topic/signal/${newRole.toLowerCase()}`;
                                        const headers = {
                                            'Authorization': `Bearer ${newAccessToken}`
                                        };
                                        stompClientRef.current.subscribe(topic, handleMessage, headers);
                                        console.log('subscribe topic - ', topic);
                                    }
                                });
                            }
                        } catch (error) {
                            console.error('WebSocket 구독 오류:', error);
                        }
                        
                        setUser({
                            ...user,
                            roles: userInfo.roles
                        });
                    })
                    .catch(error => {
                        console.error('사용자 정보 조회 실패:', error);
                    });
                break;
            case 'SIGNAL':
                content = '새로운 신호가 도착했습니다.';
                const data = JSON.parse(alarmData.data);
                const signalTime = new Date(data.chartSignal.chartSignalTime);
                const formattedTime = new Date(signalTime.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
                content += `<br>종목: ${data.stockItem.itemName}`;
                content += `<br>신호: ${data.chartSignal.chartSignalType}`;
                // content += `<br>수량: ${data.chartSignal.chartSignalAmount}`;
                content += `<br>시간: ${formattedTime}`;
                break;
            case 'PAYMENT_EXPIRE':
                const expireData = JSON.parse(alarmData.data);
                const expireDate = new Date(expireData.endDate);
                // UTC 시간에 9시간을 더해 한국 시간으로 변환
                const koreaTime = new Date(expireDate.getTime() + 9 * 60 * 60 * 1000);
                const formattedDate = koreaTime.toISOString().replace('T', ' ').slice(0, 19);
                content = '결제 유효기간이 얼마남지 않았습니다.';
                content += `<br>종목: ${expireData.stockCode}`;
                content += `<br>만료일: ${formattedDate}`;
                break;
            case 'LOGOUT':
                content = '다른곳에서 접속하여 로그아웃 처리되었습니다.';
                setUser(null);
                break;
            default:
                content = message.body;
        }

        modal.info({
            title: '알림',
            content: <div dangerouslySetInnerHTML={{ __html: content }} />,
            onOk: () => {
                if (alarmData.category === 'LOGOUT') {
                    router.push(mainUrl);
                }
            }
        });
    }

    return (
        <>
            {children}
        </>
    );
}
