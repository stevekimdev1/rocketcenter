import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { storageKeys, urls } from '@/src/const';
import axios from 'axios';

let stompClient = null;

export const connectWebSocket = (onConnect = () => { }) => {
  if (stompClient) {
    return; // 이미 연결된 클라이언트가 있으면 아무것도 하지 않음
  }

  const token = localStorage.getItem(storageKeys.accessToken);

  stompClient = new Client({
    brokerURL: '', // 실제로는 사용되지 않음
    reconnectDelay: 60000,
    webSocketFactory: () => {
      return new SockJS(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
    },
    connectHeaders: {  // 헤더 추가
      Authorization: `Bearer ${token}`,
    },
  });

  stompClient.onConnect = (frame) => {
    console.log('WebSocket Connected:', frame);
    onConnect(stompClient);
  };

  stompClient.onStompError = async (frame) => {
    console.error('Broker reported error:', frame.headers['message']);
    console.error('Additional details:', frame.body);
    // 오류 발생 시 토큰 갱신
    const refreshResponse = await axios.post(urls.refresh, {
      refreshToken: localStorage.getItem(storageKeys.refreshToken),
    });

    const newAccessToken = refreshResponse.data.accessToken;
    console.log('newAccessToken - ', newAccessToken);
    localStorage.setItem(storageKeys.accessToken, newAccessToken);
  };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    console.log('WebSocket Disconnected');
  }
};

export const getStompClient = () => stompClient; 