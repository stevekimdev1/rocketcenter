'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageKeys, urls } from '@/src/const';
import httpClient from '@/src/lib/util/httpclient';


const UserContext = createContext({
  user: null,
  setUser: () => {},
  clearUser: () => {},
  newAlarmCount: 0,
  reloadNewAlarmCount: () => {},
});

export function UserProvider({ children }) {
  // localStorage에서 초기값 가져오기를 시도
  const [user, setUser] = useState(null);
  const [newAlarmCount, setNewAlarmCount] = useState(0);

  // 컴포넌트 마운트 시 localStorage에서 사용자 정보 복원
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(storageKeys.user);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Failed to restore user from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
        reloadNewAlarmCount();
    }
  }, [user]);

  // 사용자 정보 설정 시 localStorage에도 저장
  const updateUser = (newUser) => {
    console.log('************* updateUser - ', newUser);
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(storageKeys.user, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(storageKeys.user);
    }
  };

  // 사용자 정보 초기화 (로그아웃 시 사용)
  const clearUser = () => {
    setUser(null);
    localStorage.removeItem(storageKeys.user);
  };

  const reloadNewAlarmCount = async () => {
    try {
      const response = await httpClient.get(urls.alarmNewCount);
      setNewAlarmCount(response.data);
    } catch (error) {
      console.error('신규 알람 조회 중 오류 발생:', error);
    }
  };


  return (
    <UserContext.Provider value={{ user, setUser: updateUser, clearUser, newAlarmCount, reloadNewAlarmCount }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 