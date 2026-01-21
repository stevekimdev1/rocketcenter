'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/src/css/Navbar.module.css';
import { useUser } from '@/src/context/UserContext';
import { storageKeys, mainUrl, urls } from '@/src/const';
import { UserOutlined, LogoutOutlined, CloseOutlined, MenuOutlined, BellOutlined } from '@ant-design/icons';
import { App } from 'antd';
import { useState, useEffect } from 'react';
import httpClient from '@/src/lib/util/httpclient';
import { Badge } from 'antd';

const Navbar = () => {
  const { message, modal } = App.useApp();
  const { user, setUser, newAlarmCount, reloadNewAlarmCount } = useUser();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 햄버거 메뉴 상태

  const handleLogout = () => {
    modal.confirm({
      title: '로그아웃',
      content: '로그아웃 하시겠습니까?',
      okText: '확인',
      cancelText: '취소',
      onOk() {
        // 토큰 및 유저 정보 삭제
        localStorage.removeItem(storageKeys.accessToken);
        localStorage.removeItem(storageKeys.refreshToken);
        localStorage.removeItem(storageKeys.user);
        setUser(null);
        router.push(mainUrl);
      }
    });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); // 햄버거 메뉴 열기/닫기
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContent}>
        <div className={styles.logo}>
          <Link href="/">
            <img src="/img/logo.png" alt="logo" />
          </Link>
        </div>

        {/* 햄버거 메뉴 아이콘 */}
        <div className={styles.hamburger} onClick={toggleMenu}>
          {isMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
        </div>

        {/* 데스크탑 메뉴 */}
        <div className={styles.menuItems}>
          <Link href="/menu/chart" className={styles.menuLink}>
            Signal Chart
          </Link>
          {/* <Link href="/menu/economic" className={styles.menuLink}>
            경제캘린더
          </Link> */}
          <Link href="/menu/subscription" className={styles.menuLink}>
            구독신청
          </Link>
          {/* <Link href="/menu/pinterest" className={styles.menuLink}>
            유익한정보
          </Link> */}
          <Link href="/menu/board" className={styles.menuLink}>
            고객센터
          </Link>
          {user ? (
            <>
            {/* <Link href="/menu/board?from=alarm">
              <Badge count={newAlarmCount} style={{ backgroundColor: '#ff4d4f' }}>
                <BellOutlined style={{ fontSize: '18px' }} />
              </Badge>
            </Link> */}
              <div className={styles.menuLink}>
                <Link href="/menu/mypage" className={styles.menuMyinfo}>
                  <UserOutlined /> {user.name}님
                </Link>
                <button onClick={handleLogout}>
                  <LogoutOutlined />
                </button>
              </div>
            </>
          ) : (
            <Link href="/login" className={styles.menuLink}>
              로그인
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
        <Link href="/menu/chart" className={styles.menuLink} onClick={toggleMenu}>
          Signal Chart
        </Link>
        <Link href="/menu/economic" className={styles.menuLink} onClick={toggleMenu}>
          경제캘린더
        </Link>
        <Link href="/menu/subscription" className={styles.menuLink} onClick={toggleMenu}>
          구독신청
        </Link>
        <Link href="/menu/pinterest" className={styles.menuLink} onClick={toggleMenu}>
          유익한정보
        </Link>
        <Link href="/menu/board" className={styles.menuLink} onClick={toggleMenu}>
          고객센터
        </Link>
        {user ? (
          <>
            <div className={styles.menuLink}>
              <Link href="/menu/board?from=alarm" style={{ marginRight: '20px' }}>
                <Badge count={newAlarmCount} style={{ backgroundColor: '#ff4d4f' }}>
                  <BellOutlined style={{ fontSize: '18px' }} />
                </Badge>
              </Link>
              <Link href="/menu/mypage" className={styles.menuMyinfo} onClick={toggleMenu}>
                <UserOutlined /> {user.name}님
              </Link>
              <button onClick={handleLogout}>
                <LogoutOutlined />
              </button>
            </div>
          </>
        ) : (
          <Link href="/login" className={styles.menuLink} onClick={toggleMenu}>
            로그인
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 