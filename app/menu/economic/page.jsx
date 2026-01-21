'use client';
import { useState, useEffect } from 'react';
import { Tabs, Table, Tag, Button, Modal, Form, Input, Select, message, App, Typography, Pagination, Upload } from 'antd';
import { LockOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons';
import styles from '@/src/css/economic.module.css';

export default function Economic() {
  return (
    <div className={styles.container}>
      <iframe 
        src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&features=datepicker,timezone,timeselector,filters&countries=110,43,17,42,5,178,32,12,26,36,4,72,10,14,48,35,37,6,122,41,22,11,25,39&calType=week&timeZone=88&lang=18" 
        width="100%"
        height="100%"
        frameBorder="0" 
        allowtransparency="true" 
        marginWidth="0" 
        marginHeight="0"
        style={{
          flex: 1,
          border: 'none',
          borderRadius: '8px',
        }}
      ></iframe>
    </div>
  );
}
