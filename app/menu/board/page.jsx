'use client';
import { useState, useEffect, Suspense } from 'react';
import { Tabs, Table, Tag, Button, Modal, Form, Input, Select, message, App, Typography, Pagination, Upload } from 'antd';
import { LockOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons';
import styles from '@/src/css/board.module.css';
import httpClient from "@/src/lib/util/httpclient";
import { urls } from "@/src/const";
import { useUser } from "@/src/context/UserContext";
import { useSearchParams } from 'next/navigation';
import { getImageUrl } from '@/src/const';
const { TabPane } = Tabs;
const { TextArea } = Input;

const CATEGORIES = {
  ALL: '',
  NOTICE: 'NOTICE',
  DEPOSIT: 'DEPOSIT',
  SERVICE: 'SERVICE',
  ALARM: 'ALARM'
};

const formatDate = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 1주일 이내
  if (diffDays <= 7) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}.${day} ${hours}:${minutes}`;
  }

  // 1달 이내
  if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}주 전`;
  }

  // 1년 이내
  if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}개월 전`;
  }

  // 1년 이상
  const years = Math.floor(diffDays / 365);
  return `${years}년 전`;
};

function Board() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState(CATEGORIES.ALL);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [titleLength, setTitleLength] = useState(0);
  const [contentLength, setContentLength] = useState(0);
  const { user, reloadNewAlarmCount } = useUser();
  const [selectedPost, setSelectedPost] = useState(null);
  const [fileIdx, setFileIdx] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [writeCategory, setWriteCategory] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editPost, setEditPost] = useState(null);

  const fetchPosts = async (page = 1, category = activeTab) => {
    try {
      setLoading(true);
      let response = null;
      if (category === CATEGORIES.ALARM) {
        response = await httpClient.get(urls.alarmList.replace('%s', page).replace('%s', pagination.pageSize));
        reloadNewAlarmCount();
      }
      else {
        response = await httpClient.get(urls.boardList.replace('%s', page).replace('%s', pagination.pageSize).replace('%s', category));
      }

      const updatedPosts = await Promise.all(response.data.list.map(async (post) => {
        if (post.fileIdx) {
          const image = await getImage(post.fileIdx);
          return { ...post, imgSrc:image };
        }
        return post;
      }));
      setPosts(updatedPosts);
      setPagination({
        ...pagination,
        current: response.data.currentPage,
        total: response.data.totalCount
      });
    } catch (error) {
      console.error('게시글 조회 중 오류 발생:', error);
      message.error('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (from === 'alarm') {
      setActiveTab(CATEGORIES.ALARM)
    }
    else {
      setActiveTab(CATEGORIES.ALL)
    }
  }, [from])
  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (pagination) => {
    fetchPosts(pagination.current);
  };

  const handleTableChangeMobile = (page, pageSize) => {
    fetchPosts(page);
  };

  const handleWrite = (category) => {
    form.resetFields();
    setFileIdx(null);
    setPreviewImage(null);
    if (category && category !== CATEGORIES.NOTICE) {
      form.setFieldValue('category', category);
      setWriteCategory(category);
    }
    setIsModalVisible(true);
  };

  const handleEdit = async (post) => {
    setEditMode(true);
    setEditPost(post);
    setWriteCategory(post.category);
    form.setFieldsValue({
      title: post.title,
      content: post.content,
      category: post.category
    });
    setFileIdx(post.fileIdx);

    if (post.fileIdx) {
      const image = await getImage(post.fileIdx);
      setPreviewImage(image);
    }

    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const postData = { ...values, fileIdx };
      let response;
      if (editMode) {
        response = await httpClient.post(urls.boardModify, {
          boardIdx: editPost.boardIdx,
          ...postData
        });
      } else {
        response = await httpClient.post(urls.boardCreate, postData);
      }

      if (response.data) {
        message.success(editMode ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.');
        setIsModalVisible(false);
        form.resetFields();
        fetchPosts(1, activeTab);
      } else {
        message.error(editMode ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다.');
      }
    } catch (error) {
      message.error(editMode ? '게시글 수정 중 오류가 발생했습니다.' : '게시글 등록 중 오류가 발생했습니다.');
    } finally {
      setEditMode(false);
      setEditPost(null);
      setPreviewImage(null);
    }
  };

  const handleUpload = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await httpClient.post(urls.uploadFile, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.result) {
        setFileIdx(response.data.fileIdx);
        const imageResponse = await httpClient.get(urls.getFile.replace('%s', response.data.fileIdx), {
          responseType: 'arraybuffer'
        });
        const base64Image = `data:image/png;base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;
        setPreviewImage(base64Image);
        message.success('파일이 업로드되었습니다.');
      } else {
        message.error('파일 업로드에 실패했습니다.');
      }
    } catch (error) {
      message.error('파일 업로드 중 오류가 발생했습니다.');
    }
  };

  const getImage = async (idx) => {
    const imageResponse = await httpClient.get(urls.getFile.replace('%s', idx), {
      responseType: 'arraybuffer'
    });
    const base64Image = `data:image/png;base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;
    return base64Image;
  }

  const handleTitleClick = (record) => {
    if (record.category === 'NOTICE' || record.userIdx === user?.userIdx) {
      return (
        <>
          <div className={styles.postContent} dangerouslySetInnerHTML={{ __html: record.content }} />
          {record.imgSrc && (
            <img src={record.imgSrc} alt="첨부파일" />
          )}
          {record.reply && (
            <div className={styles.replyContent}>
              <Typography.Title level={5}>답변</Typography.Title>
              <p>{record.reply}</p>
            </div>
          )}

          {record.userIdx === user?.userIdx && record.status === 'PENDING' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => handleEdit(record)}>수정하기</Button>
            </div>
          )}
        </>
      );
    }
    return <div className={styles.secretMessage}>비밀글입니다</div>;
  };

  const handleTitleClickMobile = (record) => {
    if (record.category === 'NOTICE' || record.userIdx === user?.userIdx) {
      if (selectedPost?.boardIdx === record.boardIdx) {
        setSelectedPost(null);
      } else {
        setSelectedPost(record);
      }
    }
    else {
      message.error('비밀글입니다');
    }
  };

  const getCategoryTag = (category) => {
    switch (category) {
      case 'NOTICE':
        return <Tag color="blue">공지</Tag>;
      case 'DEPOSIT':
        return <Tag color="purple">입금</Tag>;
      case 'SERVICE':
        return <Tag color="cyan">문의</Tag>;
      default:
        return null;
    }
  };

  const columns = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Table.Summary>
          <div className={styles.titleCell}>
            {getCategoryTag(record.category)}
            {record.category !== 'NOTICE' && record.userIdx !== user?.userIdx && (
              <LockOutlined className={styles.lockIcon} />
            )}
            <span className={styles.titleText}>{text}</span>
          </div>
          {record.expanded && handleTitleClick(record)}
        </Table.Summary>
      )
    },
    {
      title: '작성자',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
      render: (text, record) => <span style={{ color: '#808080' }}>{record.category === 'NOTICE' ? '관리자' : text}</span>
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status, record) => {
        if (record.category === 'NOTICE') {
          return null;
        }
        return status === 'PENDING' ?
          <Tag color="orange">답변대기</Tag> :
          <Tag color="green">답변완료</Tag>;
      }
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      align: 'center',
      render: (date) => <span style={{ color: '#808080' }}>{formatDate(date)}</span>
    }
  ];

  const columnsAlarm = [
    {
      title: '제목',
      dataIndex: 'category',
      key: 'category',
      render: (text, record) => {
        return <span>{
          record.category === 'PAYMENT_EXPIRE' ? '결제만료 예정' :
            record.category === 'SIGNAL' ? '시그널 발생' :
              record.category === 'PAYMENT_APPROVAL' ? '결제승인 완료' :
                '알수없음'
        }</span>
      }
    },
    {
      title: '내용',
      dataIndex: 'content',
      key: 'content',
      render: (text, record) => {
        let chartSignal = null;
        let stockItem = null;
        try {
          chartSignal = JSON.parse(record.data).chartSignal;
          stockItem = JSON.parse(record.data).stockItem;
        }
        catch (error) {
        }
        return record.category === 'SIGNAL' ? (
          <span>
            {text} ({stockItem.itemName}, {chartSignal.chartSignalType}, {chartSignal.chartSignalPrice}, {chartSignal.chartSignalLevel})
          </span>
        ) : (
          <span>{text}</span>
        )
      }
    },
    {
      title: '등록일',
      dataIndex: 'createAt',
      key: 'createAt',
      width: 150,
      align: 'center',
      render: (date) => <span style={{ color: '#808080' }}>{formatDate(date)}</span>
    }
  ];
  const tabItems = [
    { key: CATEGORIES.ALL, label: '전체' },
    { key: CATEGORIES.NOTICE, label: '공지사항' },
    { key: CATEGORIES.DEPOSIT, label: '입금확인' },
    { key: CATEGORIES.SERVICE, label: '이용문의' },
    { key: CATEGORIES.ALARM, label: '알림' }
  ];

  return (
    <div className={`${styles.container} ${styles.menuBoardRoot}`}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.pcView}>
            <Tabs
              activeKey={activeTab}
              className={styles.tabs}
              onChange={handleTabChange}
              items={tabItems}
            />
          </div>
          <div className={styles.mobileView}>
            <Select
              value={activeTab}
              onChange={handleTabChange}
              style={{ width: 120 }}
            >
              {tabItems.map(item => (
                <Select.Option key={item.key} value={item.key}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </div>
          <Button
            type="primary"
            onClick={() => handleWrite(activeTab)}
            className={styles.writeButton}
          >
            글쓰기
          </Button>
        </div>
        {activeTab === CATEGORIES.ALARM ? (
          <>
            <div className={styles.pcView}>
              <Table
                columns={columnsAlarm}
                dataSource={posts}
                pagination={pagination}
                onChange={handleTableChange}
                rowKey="userAlarmIdx"
                loading={loading}
                style={{ width: '100%' }}
              />
            </div>
            <div className={styles.mobileView} style={{ flexDirection: 'column', gap: '16px' }}>
              {posts.map((post, index) => {
                let contentSignal = '';

                let chartSignal = null;
                let stockItem = null;
                try {
                  chartSignal = JSON.parse(post.data).chartSignal;
                  stockItem = JSON.parse(post.data).stockItem;

                  if (post.category === 'SIGNAL') {
                    contentSignal = `(${stockItem.itemName}, ${chartSignal.chartSignalType}, ${chartSignal.chartSignalPrice}, ${chartSignal.chartSignalLevel})`;
                  }
                }
                catch (error) {
                }

                return (
                  <div
                    key={index}
                    style={{
                      background: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <span>{post.category}</span>
                      <span style={{ color: '#808080' }}>{formatDate(post.createAt)}</span>
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                    }}>
                      {post.content}<br />
                      {contentSignal}
                    </div>
                  </div>
                )
              })}
              <Pagination
                current={pagination.current}
                total={pagination.total}
                onChange={handleTableChangeMobile}
              />
            </div>
          </>
        ) : (
          <>
            <div className={styles.pcView}>
              <Table
                columns={columns}
                dataSource={posts}
                pagination={pagination}
                onChange={handleTableChange}
                rowKey={activeTab === CATEGORIES.ALARM ? "userAlarmIdx" : "boardIdx"}
                loading={loading}
                expandable={{
                  expandedRowRender: (record) => handleTitleClick(record),
                  expandRowByClick: true,
                  expandIcon: ({ expanded }) =>
                    expanded ?
                      <RightOutlined rotate={90} className={styles.expandIcon} /> :
                      <RightOutlined className={styles.expandIcon} />
                }}
              />
            </div>
            <div className={styles.mobileView} style={{ flexDirection: 'column', gap: '16px' }}>
              {posts.map((post) => (
                <div
                  key={activeTab === CATEGORIES.ALARM ? post.userAlarmIdx : post.boardIdx}
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                  onClick={() => handleTitleClickMobile(post)}
                >
                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <span>{getCategoryTag(post.category)}</span>
                    <span>
                      {
                        post.category === 'NOTICE' ? null :
                          post.status === 'PENDING' ?
                            <Tag color="orange">답변대기</Tag> :
                            <Tag color="green">답변완료</Tag>
                      }
                    </span>
                    <span style={{ color: '#808080' }}>{formatDate(post.createdAt)}</span>
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '500',
                    whiteSpace: selectedPost?.boardIdx === post.boardIdx ? 'normal' : 'nowrap',
                    overflow: selectedPost?.boardIdx === post.boardIdx ? 'visible' : 'hidden',
                    textOverflow: selectedPost?.boardIdx === post.boardIdx ? 'clip' : 'ellipsis'
                  }}>
                    {post.category !== 'NOTICE' && post.userIdx !== user?.userIdx && (
                      <LockOutlined className={styles.lockIcon} />
                    )}
                    {post.title}
                  </div>
                  {selectedPost?.boardIdx === post.boardIdx && (
                    <>
                      <div style={{
                        color: '#666',
                        fontSize: '0.9rem',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                      }}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                      {post.reply && (
                        <div style={{
                          marginTop: '16px',
                          padding: '12px',
                          background: '#f5f5f5',
                          borderRadius: '4px'
                        }}>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            color: '#333',
                            marginBottom: '8px'
                          }}>
                            답변
                          </div>
                          <div style={{
                            color: '#666',
                            fontSize: '0.9rem'
                          }}>
                            {post.reply}
                          </div>
                        </div>
                      )}
                      {post.userIdx === user?.userIdx && post.status === 'PENDING' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button onClick={() => handleEdit(post)}>수정하기</Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              <Pagination
                current={pagination.current}
                total={pagination.total}
                onChange={handleTableChangeMobile}
              />
            </div>
          </>
        )}

        <Modal
          title={editMode ? "글 수정하기" : "글쓰기"}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditMode(false);
            setEditPost(null);
            setPreviewImage(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="category"
              label="카테고리"
              rules={[{ required: true, message: '카테고리를 선택해주세요' }]}
            >
              <Select 
                placeholder="카테고리를 선택해주세요" 
                onChange={(value) => setWriteCategory(value)} 
                disabled={editMode}
              >
                <Select.Option value={CATEGORIES.DEPOSIT}>입금확인</Select.Option>
                <Select.Option value={CATEGORIES.SERVICE}>이용문의</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="title"
              label={
                <div className={styles.labelWithCount}>
                  <span>제목</span>
                  <span className={styles.charCount}>({titleLength}/50)</span>
                </div>
              }
              rules={[
                { required: true, message: '제목을 입력해주세요' },
                { max: 50, message: '제목은 50자를 초과할 수 없습니다' }
              ]}
            >
              <Input
                placeholder="제목을 입력해주세요"
                className={styles.input}
                maxLength={50}
                onChange={(e) => setTitleLength(e.target.value.length)}
              />
            </Form.Item>
            <Form.Item
              name="content"
              label={
                <div className={styles.labelWithCount}>
                  <span>내용</span>
                  <span className={styles.charCount}>({contentLength}/200)</span>
                </div>
              }
              rules={[
                { required: true, message: '내용을 입력해주세요' },
                { max: 200, message: '내용은 200자를 초과할 수 없습니다' }
              ]}
            >
              <TextArea
                rows={6}
                placeholder={writeCategory === CATEGORIES.DEPOSIT ? "테더 입금 시 TXID 또는 전송결과 스크린샷을 업로드 해주시고, 원화 입금시에는 입금자명과 입금액을 남겨주세요." : "문의 내용을 입력해주세요."}
                className={styles.textarea}
                maxLength={200}
                onChange={(e) => setContentLength(e.target.value.length)}
              />
            </Form.Item>
            {writeCategory === CATEGORIES.DEPOSIT && (
              <>
                <Upload
                  accept="image/*"
                  customRequest={handleUpload}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />}>이미지 업로드</Button>
                </Upload>
                {previewImage && (
                  <div className={styles.previewImageContainer}>
                    <img src={previewImage} alt="Preview" className={styles.previewImage} />
                  </div>
                )}
              </>
            )}
            <div className={styles.modalFooter}>
              <p className={styles.notice}>
                * 글쓰기는 자동으로 비밀글로 등록됩니다
              </p>
              <Button type="primary" htmlType="submit">
                {editMode ? "수정하기" : "등록하기"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Board />
    </Suspense>
  );
}
