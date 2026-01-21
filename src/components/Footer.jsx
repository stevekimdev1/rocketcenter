'use client';
import { Modal } from 'antd';
import styles from '@/src/css/footer.module.css';
import { useState } from 'react';

const Footer = () => {
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [termsSrc, setTermsSrc] = useState('/agreement/terms.html');
  const [privacySrc, setPrivacySrc] = useState('/agreement/privacy.html');

  const handleTermsClick = () => {
    setTermsSrc(`/agreement/terms.html?reload=${new Date().getTime()}`);
    setIsTermsModalVisible(true);
  };  

  const handlePrivacyClick = () => {
    setPrivacySrc(`/agreement/privacy.html?reload=${new Date().getTime()}`);
    setIsPrivacyModalVisible(true);
  };

  return (
    <div className={styles.footer}>
      <div className={styles.footerContent}>
        <p>Copyright © 2025 RocketCenter. All rights reserved.</p>
        <div className={styles.links}>
          <span onClick={handleTermsClick}>이용약관</span> | <span onClick={handlePrivacyClick}>개인정보보호정책</span>
        </div>
      </div>
        <Modal
                title="이용약관"
                open={isTermsModalVisible}
                onCancel={() => setIsTermsModalVisible(false)}
                footer={null}
            >
                <iframe src={termsSrc} className={styles.modalContent} />
            </Modal>

            <Modal
                title="개인정보 보호정책"
                open={isPrivacyModalVisible}
                onCancel={() => setIsPrivacyModalVisible(false)}
                footer={null}
            >
                <iframe src={privacySrc} className={styles.modalContent} />
            </Modal>
    </div>
  );
};

export default Footer;