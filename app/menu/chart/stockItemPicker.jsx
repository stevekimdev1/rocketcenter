'use client';
import { useState, useEffect, useRef } from 'react';
import { Input, Button } from 'antd';
import { StarFilled, StarOutlined, SearchOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import styles from '@/src/css/chart.module.css';
import { storageKeys } from '@/src/const';

const StockItemPicker = ({ stocks, selectedStock, setSelectedStock, currentPrice, isDarkMode }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [favoriteStocks, setFavoriteStocks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [infoText, setInfoText] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const storedFavorites = JSON.parse(localStorage.getItem(storageKeys.favoriteStock) || '[]');
        setFavoriteStocks(storedFavorites);
    }, []);

    const handleFavoriteToggle = (itemCode) => {
        const updatedFavorites = favoriteStocks.includes(itemCode)
            ? favoriteStocks.filter(code => code !== itemCode)
            : [...favoriteStocks, itemCode];

        setFavoriteStocks(updatedFavorites);
        localStorage.setItem(storageKeys.favoriteStock, JSON.stringify(updatedFavorites));
    };

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        switch (tab) {
            case 'FAV':
                setInfoText('즐겨찾기 Favorite Stock');
                break;
            case 'ALL':
                setInfoText('전체 All Stock');
                break;
            case 'INDEX':
                setInfoText('지수 Stock Market Index Future');
                break;
            case 'MAT':
                setInfoText('원자재 Commodity Futures');
                break;
            case 'FX':
                setInfoText('외환선물 Foreign Exchange Futures');
                break;
            case 'COIN':
                setInfoText('코인선물 Coin Futures');
                break;
            default:
                setInfoText('');
        }
    };

    const filteredStocks = stocks.filter(stock => {
        const matchesSearch = stock.itemName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ALL' || stock.stockCode === activeTab || (activeTab === 'FAV' && favoriteStocks.includes(stock.itemCode));
        return matchesSearch && matchesTab;
    });

    const handleStockClick = (itemCode) => {
        setSelectedStock(itemCode);
        setIsDropdownOpen(false);
    };

    return (
        <div className={styles.stockSelect} ref={dropdownRef}>
            <div className={styles.selectedStock} onClick={handleDropdownToggle}>
                <img src={stocks.find(stock => stock.itemCode === selectedStock)?.itemIcon} alt="icon" className={styles.stockIcon} />
                {stocks.find(stock => stock.itemCode === selectedStock)?.itemName}
                <div className={styles.dropdownIcons}>
                    {isDropdownOpen ? <UpOutlined /> : <DownOutlined />}
                    <Button
                        className={styles.favoriteButton}
                        type="text"
                        icon={favoriteStocks.includes(selectedStock) ? <StarFilled style={{ color: 'gold', fontSize: '16px' }} /> : <StarOutlined style={{ color: 'gray', fontSize: '16px' }} />}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent dropdown toggle
                            handleFavoriteToggle(selectedStock);
                        }}
                    />
                    <div className={styles.currentPrice} style={{ color: currentPrice.color }}>
                        {currentPrice.close}
                    </div>
                </div>
            </div>

            {isDropdownOpen && (
                <div className={`${styles.customDropdown} ${isDarkMode ? styles.darkMode : ''}`}>
                    <Input
                        placeholder="Search"
                        prefix={<SearchOutlined style={{ color: isDarkMode ? 'white' : 'black' }} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${styles.searchBar} ${isDarkMode ? styles.darkMode : ''}`}
                    />
                    <div className={`${styles.tabs} ${isDarkMode ? styles.darkMode : ''}`}>
                        <Button onClick={() => handleTabClick('FAV')} className={activeTab === 'FAV' ? styles.activeTab : ''}>
                            <StarFilled style={{ color: 'gold' }} />
                        </Button>
                        <Button onClick={() => handleTabClick('ALL')} className={activeTab === 'ALL' ? styles.activeTab : ''}>전체</Button>
                        {/* <Button onClick={() => handleTabClick('INDEX')} className={activeTab === 'INDEX' ? styles.activeTab : ''}>지수</Button>
                        <Button onClick={() => handleTabClick('MAT')} className={activeTab === 'MAT' ? styles.activeTab : ''}>원자재</Button> */}
                        {/* <Button onClick={() => handleTabClick('FX')} className={activeTab === 'FX' ? styles.activeTab : ''}>외환</Button> */}
                        {/* <Button onClick={() => handleTabClick('COIN')} className={activeTab === 'COIN' ? styles.activeTab : ''}>코인</Button> */}
                    </div>
                    <div className={styles.stockList}>
                        {filteredStocks.map(stock => (
                            <div
                                key={stock.itemCode}
                                className={`${styles.stockItem} ${isDarkMode ? styles.darkMode : ''}`}
                                onClick={(e) => {
                                    if (!e.target.closest('button')) {
                                        handleStockClick(stock.itemCode);
                                    }
                                }}
                            >
                                <img src={stock.itemIcon} alt={stock.itemName} className={styles.stockIcon} />
                                <span className={styles.stockName}>{stock.itemName}</span>
                                <span className={styles.stockDescription}>{stock.itemDescription}</span>
                                <Button
                                    type="text"
                                    icon={favoriteStocks.includes(stock.itemCode) ? <StarFilled style={{ color: 'gold' }} /> : <StarOutlined style={{ color: 'gray' }} />}
                                    onClick={() => handleFavoriteToggle(stock.itemCode)}
                                />
                            </div>
                        ))}
                        {filteredStocks.length === 0 && <div className={styles.noStock}>종목이 없습니다</div>}
                    </div>
                    {infoText && <div className={`${styles.infoText} ${isDarkMode ? styles.darkMode : ''}`}>{infoText}</div>}
                </div>
            )}
        </div>
    );
};

export default StockItemPicker;
