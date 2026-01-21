'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Select, Button, Switch, Empty, App, Pagination, Table } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import styles from '@/src/css/chart.module.css';
import httpClient from '@/src/lib/util/httpclient';
import { urls } from '@/src/const';
import { getStompClient } from '@/src/lib/util/websocket';
import StockItemPicker from './stockItemPicker';
import TradingViewWidget from './TradingViewWidget';

const TIME_INTERVALS = ['1M', '5M', '15M', '1H', '1D'];

export default function ChartPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [stocks, setStocks] = useState([]);
    const stocksRef = useRef([]);
    const authStocksRef = useRef([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [currentPrice, setCurrentPrice] = useState({ close: 0, color: '#26a69a' });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const isChartInitializingRef = useRef(false);
    const containerRef = useRef(null);
    const [hasSubscription, setHasSubscription] = useState(true);
    const [selectedInterval, setSelectedInterval] = useState('5M');
    const [isLoading, setIsLoading] = useState(false);
    const [mainSeries, setMainSeries] = useState(null);
    const mainSeriesRef = useRef(null);
    const [volumeSeries, setVolumeSeries] = useState(null);
    const volumeSeriesRef = useRef(null);
    const chartDataRef = useRef([]);
    const isLoadingMoreRef = useRef(false);
    const oldestLoadedTimeRef = useRef(null);
    const selectedStockRef = useRef(null);
    const selectedIntervalRef = useRef('1M');
    const markersRef = useRef([]);
    const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
    let prevTime = null;
    const [signalList, setSignalList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalSignals, setTotalSignals] = useState(0);
    const last1mDataRef = useRef({ minute: -1, minuteVolume: 0 });
    const [utcOffset, setUtcOffset] = useState(9); // Default to UTC+9

    const timeRangeSetting = [
        {name: '1D', interval: '1M', quantity: 60 * 24},
        {name: '5D', interval: '5M', quantity: 60 * 24},
        {name: '1M', interval: '1H', quantity: 1200},
        {name: '3M', interval: '1D', quantity: 1300},
        // {name: '6M', interval: '1M', quantity: 60 * 24},
        // {name: '1Y', interval: '1M', quantity: 60 * 24},
        // {name: 'ALL', interval: '1M', quantity: 60 * 24},
    ]

    useEffect(() => {
        const savedStock = localStorage.getItem('selectedStock');
        if (savedStock) {
            setSelectedStock(savedStock);
        }
        else {
            setSelectedStock('BTCUSDT');
        }
    }, []);

    useEffect(() => {
        if (selectedStock) {
            localStorage.setItem('selectedStock', selectedStock);
        }
    }, [selectedStock]);
    
    // selectedStock이 변경될 때 ref 업데이트
    useEffect(() => {
        console.log('selectedStock', selectedStock);
        selectedStockRef.current = selectedStock;
        const isAuthorized = authStocksRef.current.some(stock => stock.itemCode === selectedStock);
        if (!isAuthorized) {
            setSelectedInterval('5M');
        }

        const fetchLast1MData = async () => {
            if (selectedStock == null) {
                return;
            }
            try {
                const response = await httpClient.get(urls.signalChartDataLast1M.replace('%s', selectedStock));
                last1mDataRef.current = response.data;
            } catch (error) {
                console.error('Error fetching last 1M data:', error);
            }
        };

        fetchLast1MData();

    }, [selectedStock]);

    // selectedInterval이 변경될 때 ref 업데이트
    useEffect(() => {
        selectedIntervalRef.current = selectedInterval;
    }, [selectedInterval]);

    useEffect(() => {
        stocksRef.current = stocks;
    }, [stocks]);

    useEffect(() => {
        mainSeriesRef.current = mainSeries;
    }, [mainSeries]);

    useEffect(() => {
        volumeSeriesRef.current = volumeSeries;
    }, [volumeSeries]);
    // 초기 데이터 로딩 useEffect 수정
    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const response = await httpClient.get(urls.signalAllStockItem);
                setStocks(response.data.sort((a, b) => a.itemOrder - b.itemOrder));
                if (response.data.length > 0) {
                    // setSelectedStock(response.data[0].itemCode);
                    setHasSubscription(true);
                } else {
                    setHasSubscription(false);
                }
            } catch (error) {
                console.error('Error fetching stocks:', error);
                setHasSubscription(false);
            }

            try {
                const response = await httpClient.get(urls.signalMyStockItem);
                authStocksRef.current = response.data;
            } catch (error) {
                authStocksRef.current = [];
            }

        };

        fetchStocks();
    }, []);
    useEffect(() => {

        const fetchSignalList = async (page = 1) => {
            if (!selectedStock) return;
            try {
                const response = await httpClient.get(urls.signalList.replace('%s', selectedStock).replace('%s', page).replace('%s', 10));
                setSignalList(response.data.list);
                setTotalSignals(Math.min(response.data.totalCount, 40));
            } catch (error) {
                console.error('Error fetching signal list:', error);
            }
        };

        fetchSignalList(currentPage);
    }, [currentPage, selectedStock]);

    const adjustTime = (data) => {
        const newData = {
            ...data,
            time: (() => {
                const interval = selectedIntervalRef.current;
                let adjustedTime;
                switch (interval) {
                    case '1M':
                        adjustedTime = Math.floor(data.time / 60) * 60;
                        break;
                    case '5M':
                        adjustedTime = Math.floor(data.time / (5 * 60)) * 5 * 60;
                        break;
                    case '15M':
                        adjustedTime = Math.floor(data.time / (15 * 60)) * 15 * 60;
                        break;
                    case '1H':
                        adjustedTime = Math.floor(data.time / (60 * 60)) * 60 * 60;
                        break;
                    case '1D':
                        adjustedTime = Math.floor(data.time / (24 * 60 * 60)) * 24 * 60 * 60;
                        break;
                    default:
                        adjustedTime = data.time;
                }

                return adjustedTime;
            })()
        }
        return newData;
    }

    // 차트 데이터 가져오기
    const fetchChartData = useCallback(async (itemCode, interval, from, to, isLoadingMore = false) => {

        console.log('fetchChartData', itemCode, interval, from, to, isLoadingMore);
        // Adjust from and to for UTC+9 offset
        // const utcOffsetMs = (utcOffset - 9) * 60 * 60 * 1000;
        // from = from + utcOffsetMs;
        // to = to + utcOffsetMs;
        if (itemCode == null) {
            return { chartData: [], markers: [] };
        }
        try {
            if (isLoadingMore) {
            } else {
                setIsLoading(true);
            }

            // 차트 데이터와 시그널 데이터를 병렬로 가져오기
            const [chartResponse, signalResponse] = await Promise.all([
                httpClient.get(urls.signalChartData.replace('%s', itemCode).replace('%s', interval).replace('%s', from).replace('%s', to)),
                httpClient.get(urls.signalChartSignalData.replace('%s', itemCode).replace('%s', from).replace('%s', to)).catch(error => {
                    console.error('Error fetching signal data:', error);
                    return { data: [] };
                })
            ]);

            const formattedData = chartResponse.data.map(item => ({
                time: Math.floor(new Date(item.openTime).getTime() / 1000 + (0 * 60 * 60)), // Adjust for UTC offset
                open: item.openPrice,
                high: item.highPrice,
                low: item.lowPrice,
                close: item.closePrice,
                value: item.volume,
            })).map(adjustTime);

            // 시간 간격에 따른 밀리초 계산
            const intervalMs = {
                '1M': 60,
                '5M': 5 * 60,
                '15M': 15 * 60,
                '1H': 60 * 60,
                '1D': 24 * 60 * 60
            }[interval];

            // from부터 to까지 interval 간격으로 모든 시간 생성
            const allTimes = [];
            const startTime = Math.ceil(from / 1000 / intervalMs) * intervalMs;
            const currentTime = Math.floor(new Date().getTime() / 1000);
            const endTime = Math.min(parseInt(to / 1000), currentTime);

            for (let t = startTime; t <= endTime; t += intervalMs) {
                allTimes.push(t);
            }

            // formattedData에 있는 시간대만 필터
            // const filledData = allTimes.map(time => {
            //     const existingData = formattedData.find(d => d.time === time);
            //     return existingData || { time };
            // }).sort((a, b) => a.time - b.time);
            const uniqueFormattedData = Array.from(new Map(formattedData.map(item => [item.time, item])).values());
            const filledData = uniqueFormattedData.filter(d => allTimes.includes(d.time))
                .sort((a, b) => a.time - b.time);
            console.log('filledData', filledData);

            // 시그널 데이터를 마커로 변환
            const markers = signalResponse.data.map(signal => ({
                time: Math.floor(new Date(signal.date).getTime() / 1000 - (new Date(signal.date).getSeconds()) + ((utcOffset - 9) * 60 * 60)), // Adjust for UTC offset
                position: signal.type?.toUpperCase() === 'BUY' ? 'belowBar' : 'aboveBar',
                color: signal.type?.toUpperCase() === 'BUY' ? (isDarkMode ? '#8fbeff' : '#2196F3') : (isDarkMode ? '#ff8b8b' : '#FF5252'),
                shape: signal.type?.toUpperCase() === 'BUY' ? 'arrowUp' : 'arrowDown',
                text: signal.type + "(" + signal.level + ")",
                id: "custom-marker-id",
                type: signal.type,
                price: signal.price,
                sl: signal.sl,
                tp: signal.tp,
                signalTime: signal.date,
            })).map(adjustTime);
            console.log('markers')
            console.log(markers)
            oldestLoadedTimeRef.current = from;

            return { chartData: filledData, markers };
        } catch (error) {
            console.error('Error fetching chart data:', error);
            return { chartData: [], markers: [] };
        } finally {
            if (isLoadingMore) {
            } else {
                setIsLoading(false);
            }
        }
    }, [utcOffset]);

    // 컴포넌트 레벨에서 핸들러 정의
    const handleVisibleRangeChange = useCallback(async (logicalRange) => {
        if (!logicalRange || logicalRange.from > 10 || isLoadingMoreRef.current || !oldestLoadedTimeRef.current) return;
        console.log('handleVisibleRangeChange', logicalRange);
        isLoadingMoreRef.current = true;
        try {
            const additionalData = await fetchChartData(
                selectedStockRef.current,
                selectedIntervalRef.current,
                oldestLoadedTimeRef.current - calculateTimeRange(selectedIntervalRef.current),
                oldestLoadedTimeRef.current,
                true
            );

            if (additionalData.chartData.length > 0) {
                setTimeout(async () => {  // async 추가
                    try {
                        // lightweight-charts에서 createSeriesMarkers import
                        const { createSeriesMarkers } = await import('lightweight-charts');

                        chartDataRef.current = [...additionalData.chartData, ...chartDataRef.current];
                        if (additionalData.markers.length > 0) {
                            markersRef.current = [...markersRef.current, ...additionalData.markers.map(adjustTime)];
                        }

                        mainSeries.setData(chartDataRef.current);
                        volumeSeries.setData(chartDataRef.current.map(d => ({
                            ...d,
                            color: d.close >= d.open ? '#26a69a' : '#ef5350',
                        })));

                        // 마커 업데이트
                        if (mainSeries && markersRef.current.length > 0) {
                            createSeriesMarkers(mainSeries, markersRef.current);
                        }

                        isLoadingMoreRef.current = false;
                    } catch (error) {
                        console.error('Error loading more data:', error);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error loading more data:', error);
        }
    }, [selectedStockRef, selectedIntervalRef, mainSeries, volumeSeries]);

    const calculateTimeRange = (interval) => {
        switch (interval) {
            case '1M':
                return 24 * 60 * 60 * 1000;
            case '5M':
                return 5 * 24 * 60 * 60 * 1000;
            case '15M':
                return 7 * 24 * 60 * 60 * 1000;
            case '1H':
                return 14 * 24 * 60 * 60 * 1000;
            case '1D':
                return 180 * 24 * 60 * 60 * 1000;
            default:
                return 7 * 24 * 60 * 60 * 1000;
        }
    }
    // 차트 데이터 업데이트 useEffect 수정
    // useEffect(() => {
    //     console.log('useEffect triggered:', { selectedStock: selectedStockRef.current, selectedInterval: selectedIntervalRef.current });
    //     isLoadingMoreRef.current = false;
    //     chartDataRef.current = [];
    //     const timeoutId = setTimeout(updateData, 0);

    //     return () => {
    //         clearTimeout(timeoutId);
    //     };
    // }, [selectedStock, selectedInterval]);

    const updateData = async () => {
        console.log('updateData check:', {
            selectedStock: selectedStockRef.current,
            hasSubscription,
            chartRef: !!chartRef.current,
            selectedInterval: selectedIntervalRef.current
        });

        if (!selectedStockRef.current || !hasSubscription || !chartRef.current || !selectedIntervalRef.current) {
            console.log('updateData conditions not met');
            return;
        }

        try {
            const now = new Date().getTime();
            let timeRange = calculateTimeRange(selectedIntervalRef.current);
            const from = now - timeRange;
            const { chartData, markers } = await fetchChartData(
                selectedStockRef.current,
                selectedIntervalRef.current,
                from,
                now
            );

            if (!chartData.length || !chartRef.current) return;

            chartDataRef.current = chartData;
            markersRef.current = markers.map(adjustTime);

            // 기존 시리즈 제거
            if (mainSeries) {
                try {
                    chartRef.current.removeSeries(mainSeries);
                } catch (error) {
                }
            }
            if (volumeSeries) {
                try {
                    chartRef.current.removeSeries(volumeSeries);
                } catch (error) {
                }
            }

            const { CandlestickSeries, HistogramSeries, createSeriesMarkers } = await import('lightweight-charts');

            const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderVisible: false,
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            });

            // 캔들 데이터 설정
            candleSeries.setData(chartData);

            // 마커 데이터 설정
            // candleSeries.setMarkers(markers);
            // console.log('updateData markers', markers);
            createSeriesMarkers(candleSeries, markers.map(adjustTime));

            const volumeSeriesObj = chartRef.current.addSeries(HistogramSeries, {
                priceFormat: {
                    type: 'volume',
                },
            });
            volumeSeriesObj.moveToPane(2);

            // 볼륨 데이터 설정
            volumeSeriesObj.setData(chartData.map(d => ({
                ...d,
                color: d.close >= d.open ? '#26a69a' : '#ef5350',
            })));

            setMainSeries(candleSeries);
            setVolumeSeries(volumeSeriesObj);

            // 스크롤 이벤트 구독
            // chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
        } catch (error) {
            console.error('Error updating chart data:', error);
        }
    };
    useEffect(() => {
        if (!chartRef.current) return;

        const timeScale = chartRef.current.timeScale();
        if (!timeScale) return;

        timeScale.subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

        return () => {
            if (!chartRef.current) return;
            const timeScale = chartRef.current.timeScale();
            if (!timeScale) return;
            timeScale.unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
        };
    }, [handleVisibleRangeChange]);

    const initChart = async () => {
        if (!chartContainerRef.current || isChartInitializingRef.current || chartRef.current) return;
        isChartInitializingRef.current = true;
        try {
            const { createChart, CrosshairMode } = await import('lightweight-charts');
            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { color: isDarkMode ? '#1a1a1a' : '#ffffff' },
                    textColor: isDarkMode ? '#d9d9d9' : '#333333',
                    padding: {
                        top: 10,
                        right: 10,
                        bottom: 10,
                        left: 10
                    }
                },
                grid: {
                    vertLines: { color: isDarkMode ? '#2B2B43' : '#e1e1e1' },
                    horzLines: { color: isDarkMode ? '#2B2B43' : '#e1e1e1' },
                },
                width: chartContainerRef.current.clientWidth || 800,
                height: chartContainerRef.current.clientHeight || 500,
                localization: {
                    timeFormatter: (time) => {
                        const date = new Date(time * 1000);
                        return date.toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        });
                    },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                    borderColor: isDarkMode ? '#2B2B43' : '#e1e1e1',
                    rightOffset: 5,
                    barSpacing: 12,
                    minBarSpacing: 1,
                    visible: true,
                    tickMarkFormatter: (time) => {
                        const date = new Date(time * 1000);
                        return date.toLocaleTimeString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        });
                    },
                },
                rightPriceScale: {
                    borderColor: isDarkMode ? '#2B2B43' : '#e1e1e1',
                    scaleMargins: {
                        top: 0.05,
                        bottom: 0.2,
                    },
                    entireTextOnly: true,
                    visible: true,  // 가격 스케일 표시
                    autoScale: true,  // 자동 스케일링
                },
                // 차트 기본 범위 설정
                handleScale: {
                    axisPressedMouseMove: true,
                    mouseWheel: true,
                    pinch: true,
                },
                // 크로스헤어 설정
                crosshair: {
                    vertLine: {
                        color: '#758696',
                        width: 1,
                        style: 3,
                        visible: true,
                        labelVisible: true,
                    },
                    mode: CrosshairMode.Normal,
                },
            });

            chart.subscribeCrosshairMove((param) => {
                if (!param || !param.time || !param.seriesData) return;
                if (!param || !param.point || param.point.x < 0 || param.point.y < 0) {
                    setTooltip({ visible: false, text: '', x: 0, y: 0 });
                    return;
                }

                if (prevTime === param.time) return;
                prevTime = param.time;

                const hoveredTime = param.time;
                // const hoveredMarker = markersRef.current.find(marker => marker.time === hoveredTime);
                
                const hoveredMarker = markersRef.current.filter(marker => marker.time === hoveredTime);

                if (hoveredMarker.length > 0) {
                    const price = param.seriesData.get(mainSeriesRef.current).close;
                    const y = mainSeriesRef.current.priceToCoordinate(price);
                    console.log('price:', price);
                    console.log('y:', y);
                    console.log('hoveredMarker', hoveredMarker)

                    setTooltip({
                        visible: true,
                        text: (
                            <div>
                                {hoveredMarker.map((marker, idx) => (
                                    <div key={idx} style={{ borderBottom: '1px solid #ccc', padding: '5px', margin: '5px 0', 
                                    backgroundColor: marker.type.toUpperCase() === 'SELL' ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 255, 0, 0.4)' }}>
                                        <div>진입시점: {marker.signalTime}</div>
                                        <div>진입가: {marker.price?.toLocaleString()}</div>
                                        <div>방향: {marker.type}</div>
                                    </div>
                                ))}
                                {/* <div style={{ color: 'red' }}>SL: {hoveredMarker.sl.toLocaleString()}</div>
                                <div style={{ color: 'green' }}>TP: {hoveredMarker.tp.toLocaleString()}</div> */}
                            </div>
                        ),
                        x: param.point.x,
                        y: y
                    });
                } else {
                    setTooltip({ visible: false, text: '', x: 0, y: 0 });
                }
            });





            // 기본 시간 범위 설정 (예: 최근 30일)
            // const now = Math.floor(Date.now() / 1000);
            // const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
            // chart.timeScale().setVisibleRange({
            //     from: thirtyDaysAgo,
            //     to: now,
            // });
            console.log('chart created!!')
            chartRef.current = chart;
            await updateData();
        } catch (error) {
            console.error('Chart initialization error:', error);
        } finally {
            isChartInitializingRef.current = false;
        }
    };
    // 차트 초기화 useEffect 수정
    useEffect(() => {
        let isDisposed = false;
        console.log('### check initchart ###');
        if (hasSubscription && !chartRef.current) {
            oldestLoadedTimeRef.current = null;
            initChart();
        }

        return () => {
            isDisposed = true;
            if (chartRef.current) {
                try {
                    chartRef.current.remove();
                    chartRef.current = null;
                    setMainSeries(null);
                    setVolumeSeries(null);
                } catch (error) {
                    console.error('Chart cleanup error:', error);
                }
            }
        };
    }, [isDarkMode, hasSubscription, selectedStock, selectedInterval, utcOffset]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // 전체화면 변경 감지 및 차트 크기 조정
    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.resize(
                    chartContainerRef.current.clientWidth,
                    chartContainerRef.current.clientHeight
                );
            }
        };

        // 전체화면 변경 이벤트 리스너
        const handleFullscreenChange = () => {
            handleResize();
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const handleChartData = (message) => {
        const data = JSON.parse(message.body);
        // Find matching stock by stockItemIdx and compare itemCode
        const matchingStock = stocksRef.current.find(stock => stock.stockItemIdx == data.stockItemIdx);
        if (!matchingStock || matchingStock.itemCode !== selectedStockRef.current) {
            return;
        }
        if (mainSeriesRef.current && volumeSeriesRef.current) {
            const formattedData = adjustTime({
                time: Math.floor(data.openTime / 1000) + ((0 - 9) * 60 * 60), // Adjust for UTC offset
                // time: Math.floor(data.openTime / 1000) + ((utcOffset - 9) * 60 * 60), // Adjust for UTC offset
                open: Number(data.openPrice),
                high: Number(data.highPrice),
                low: Number(data.lowPrice),
                close: Number(data.closePrice),
                value: Number(data.volume),
            });
            // Update chartDataRef with new data
            const lastDataTime = chartDataRef.current.length > 0 ? chartDataRef.current[chartDataRef.current.length - 1].time : 0;
            if (formattedData.time === lastDataTime) {
                //formattedData 오픈, 하이, 로우, 볼륨 머지작업
                formattedData.open = chartDataRef.current[chartDataRef.current.length - 1].open;
                formattedData.high = Math.max(formattedData.high, chartDataRef.current[chartDataRef.current.length - 1].high);
                formattedData.low = Math.min(formattedData.low, chartDataRef.current[chartDataRef.current.length - 1].low);

                //볼륨은 마지막 1분데이터 참고하여 업데이트
                //분이 바뀐경우 볼륨자체 합산
                //분이 안바뀐경우 증분만큼 더해서 세팅
                // console.log('last1mDataRef.current', last1mDataRef.current);
                // console.log('formattedData.time', data.openTime / 1000);
                // console.log('formattedData.time % 60', Math.floor(data.openTime / 1000 / 60) % 60);
                if (Math.floor(data.openTime / 1000 / 60) % 60 == last1mDataRef.current.minute) {
                    formattedData.value = chartDataRef.current[chartDataRef.current.length - 1].value + formattedData.value - last1mDataRef.current.minuteVolume;
                }
                else {
                    formattedData.value = chartDataRef.current[chartDataRef.current.length - 1].value + formattedData.value
                }

                // Update existing data point
                chartDataRef.current[chartDataRef.current.length - 1] = formattedData;

            } else {
                // Add new data point
                chartDataRef.current.push(formattedData);
                
            }
            last1mDataRef.current = {
                minute: Math.floor(data.openTime / 1000 / 60) % 60,
                minuteVolume: Number(data.volume)
            }
            // console.log('update chart with data: ', formattedData);
            mainSeriesRef.current.update(formattedData);
            volumeSeriesRef.current.update({
                ...formattedData,
                color: formattedData.close >= formattedData.open ? '#26a69a' : '#ef5350'
            });
            setCurrentPrice({ close: formattedData.close, color: data.closePrice >= data.openPrice ? '#26a69a' : '#ef5350' });
        }
    }
    const handleSignalData = async (message) => {
        console.log('handleSignalData', message);

        const data = JSON.parse(message.body);
        const isAuthorized = authStocksRef.current.some(stock => stock.itemCode === data.code);
        if (!isAuthorized) return;
        if (selectedStockRef.current !== data.code) return;
        const formattedData = {
            time: new Date(data.date).getTime() / 1000 - (new Date(data.date).getSeconds()) + ((utcOffset - 9) * 60 * 60), // Adjust for UTC offset
            position: data.type?.toUpperCase() === 'BUY' ? 'belowBar' : 'aboveBar',
            color: data.type?.toUpperCase() === 'BUY' ? (isDarkMode ? '#8fbeff' : '#2196F3') : (isDarkMode ? '#ff8b8b' : '#FF5252'),
            shape: data.type?.toUpperCase() === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: data.type + '(' + data.level + ')',
            type: data.type,
            price: data.price,
            sl: data.sl,
            tp: data.tp,
            signalTime: data.date,
        }
        // Update markersRef with new marker
        markersRef.current.push(adjustTime(formattedData));
        console.log('handleSignalData', formattedData);
        if (mainSeriesRef.current && volumeSeriesRef.current) {
            const { createSeriesMarkers } = await import('lightweight-charts');
            createSeriesMarkers(mainSeriesRef.current, markersRef.current);
        }
    }
    useEffect(() => {
        let subscriptionData = null;
        let subscriptionSignal = null;
        let connectionCheckInterval = null;

        const setupSubscription = async () => {
            const stompClient = getStompClient();
            if (!stompClient?.connected) {
                return false;
            }

            subscriptionData = stompClient.subscribe('/topic/chart-data', handleChartData);
            subscriptionSignal = stompClient.subscribe('/topic/chart-signal', handleSignalData);
            return true;
        };

        // 연결될 때까지 주기적으로 확인
        const startConnectionCheck = () => {
            connectionCheckInterval = setInterval(async () => {
                const success = await setupSubscription();
                if (success) {
                    clearInterval(connectionCheckInterval);
                }
            }, 1000); // 1초마다 확인
        };

        startConnectionCheck();

        return () => {
            if (subscriptionData) {
                subscriptionData.unsubscribe();
            }
            if (subscriptionSignal) {
                subscriptionSignal.unsubscribe();
            }
            if (connectionCheckInterval) {
                clearInterval(connectionCheckInterval);
            }
        };
    }, []);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const columns = [
        {
            title: '일시',
            dataIndex: 'date',
            key: 'date',
            align: 'left',
            render: (text) => {
                const date = new Date(new Date(text).getTime() + ((0 + 9) * 60 * 60 * 1000)); // Adjust for UTC offset
                return date.toISOString().replace('T', ' ').substring(0, 19);
            },
        },
        {
            title: '방향',
            dataIndex: 'type',
            key: 'type',
            align: 'center',
            render: (type) => (
                // <span className={type?.toUpperCase() === 'BUY' ? styles.buySignal : styles.sellSignal}>
                <span>
                    {type}
                </span>
            ),
        },
        {
            title: '진입가',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (price) => price?.toLocaleString(),
        },
        {
            title: '결과',
            dataIndex: 'result',
            key: 'result',
            align: 'right',
            render: (result) => {
                if (result === 'T/P') {
                    return <span style={{ color: '#0bb70b' }}>{result}</span>
                } else if (result === 'S/L') {
                    return <span style={{ color: '#ff0000' }}>{result}</span>
                } else {
                    return <span>{result}</span>
                }
            }
            // render: (result, record) => ({
            //     children: result === 'T/P' ? record.tp?.toLocaleString() : result === 'S/L' ? record.sl?.toLocaleString() : '',
            //     props: {
            //         style: {
            //             color: '#fff',
            //             backgroundColor: result === 'T/P' ? '#0bb70b' : result === 'S/L' ? '#ff0000' : 'transparent',
            //         },
            //     },
            // }),
        },
    ];

    return (
        <div
            ref={containerRef}
            className={`${styles.container} ${styles.menuChartRoot}`}
            style={{
                backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                color: isDarkMode ? '#ffffff' : '#000000'
            }}
        >
            {hasSubscription ? (
                <>
                    <div className={styles.header}
                        style={{
                            backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                            color: isDarkMode ? '#ffffff' : '#000000'
                        }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
                            <StockItemPicker
                                stocks={stocks}
                                selectedStock={selectedStock}
                                setSelectedStock={setSelectedStock}
                                currentPrice={currentPrice}
                                isDarkMode={isDarkMode}
                            />
                            <div className={styles.timeIntervals}>
                                {TIME_INTERVALS.map(interval => {
                                    const isAuthorized = authStocksRef.current.some(stock => stock.itemCode === selectedStock);
                                    return (isAuthorized || interval === '5M') && (
                                        <Button
                                            key={interval}
                                            type={interval === selectedInterval ? 'primary' : 'default'}
                                            onClick={() => {
                                                setSelectedInterval(interval)
                                            }}
                                            loading={isLoading && interval === selectedInterval}
                                            className={isDarkMode ? styles.darkModeButton : ''}
                                        >
                                            {interval}
                                        </Button>
                                    )
                                })}
                            </div>
                            <div className={styles.tradeRemarks}>
                                {authStocksRef.current.find(stock => stock.itemCode === selectedStock)?.tradeRemark && (
                                    <>
                                        <InfoCircleOutlined style={{ marginRight: '5px' }} />
                                        {authStocksRef.current.find(stock => stock.itemCode === selectedStock)?.tradeRemark}
                                    </>
                                )}
                            </div>

                        </div>


                        <div className={styles.controls}>
                            <Switch
                                checked={isDarkMode}
                                onChange={setIsDarkMode}
                                checkedChildren="Dark"
                                unCheckedChildren="Light"
                            />
                            <Button
                                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                                onClick={toggleFullscreen}
                            />
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        {tooltip.visible && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${tooltip.x - 100}px`,
                                    top: `${tooltip.y - 100}px`,
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid #ccc',
                                    color: 'black',
                                    padding: '10px',
                                    borderRadius: '3px',
                                    pointerEvents: 'none',
                                    zIndex: 1000,
                                    width: '200px',
                                    fontSize: '12px',
                                }}
                            >
                                {tooltip.text}
                            </div>
                        )}
                        <div ref={chartContainerRef} className={styles.chartContainer} />
                        {/* <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                            {timeRangeSetting.map(setting => (
                                <Button key={setting.name} onClick={() => {
                                    chartRef.current.timeScale().setVisibleLogicalRange({
                                        from: chartDataRef.current.length - setting.quantity, to: chartDataRef.current.length
                                    });
                                }}>
                                    {setting.name}
                                </Button>
                            ))}
                        </div> */}
                        {/* <div className={styles.timezoneSelectorContainer}>
                            <Select
                                defaultValue="UTC+9"
                                popupClassName="timezone-dropdown"
                                className={styles.timezoneSelector}
                                onChange={(value) => {
                                    const offset = parseInt(value.replace('UTC', ''));
                                    setUtcOffset(offset);
                                    // updateData(); // Re-fetch data with new offset
                                }}
                                options={[
                                    { value: 'UTC-12', label: 'UTC-12 (Baker Island)' },
                                    { value: 'UTC-11', label: 'UTC-11 (Samoa)' },
                                    { value: 'UTC-10', label: 'UTC-10 (Hawaii)' },
                                    { value: 'UTC-9', label: 'UTC-9 (Alaska)' },
                                    { value: 'UTC-8', label: 'UTC-8 (Los Angeles)' },
                                    { value: 'UTC-7', label: 'UTC-7 (Denver)' },
                                    { value: 'UTC-6', label: 'UTC-6 (Chicago)' },
                                    { value: 'UTC-5', label: 'UTC-5 (New York)' },
                                    { value: 'UTC-4', label: 'UTC-4 (Caracas)' },
                                    { value: 'UTC-3', label: 'UTC-3 (Buenos Aires)' },
                                    { value: 'UTC-2', label: 'UTC-2 (South Georgia)' },
                                    { value: 'UTC-1', label: 'UTC-1 (Azores)' },
                                    { value: 'UTC+0', label: 'UTC+0 (London)' },
                                    { value: 'UTC+1', label: 'UTC+1 (Paris)' },
                                    { value: 'UTC+2', label: 'UTC+2 (Cairo)' },
                                    { value: 'UTC+3', label: 'UTC+3 (Moscow)' },
                                    { value: 'UTC+4', label: 'UTC+4 (Dubai)' },
                                    { value: 'UTC+5', label: 'UTC+5 (Karachi)' },
                                    { value: 'UTC+6', label: 'UTC+6 (Dhaka)' },
                                    { value: 'UTC+7', label: 'UTC+7 (Bangkok)' },
                                    { value: 'UTC+8', label: 'UTC+8 (Singapore)' },
                                    { value: 'UTC+9', label: 'UTC+9 (Seoul)' },
                                    { value: 'UTC+10', label: 'UTC+10 (Sydney)' },
                                    { value: 'UTC+11', label: 'UTC+11 (Solomon Islands)' },
                                    { value: 'UTC+12', label: 'UTC+12 (Auckland)' },
                                ]}
                            />
                        </div> */}
                    </div>
                    <div className={styles.signalList}>
                        <Table
                            columns={columns}
                            dataSource={signalList}
                            pagination={{
                                current: currentPage,
                                total: totalSignals,
                                pageSize: 10,
                                onChange: handlePageChange,
                                position: ['bottomCenter'],
                                showSizeChanger: false
                            }}
                            style={{ flex: 1 }}
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                            <TradingViewWidget />
                        </div>
                    </div>
                </>
            ) : (
                <div className={styles.noSubscriptionContainer}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className={styles.noSubscriptionContent}>
                                <p>현재 구독중인 상품이 없습니다.</p>
                                <Button
                                    type="primary"
                                    onClick={() => router.push('/menu/subscription')}
                                    className={styles.subscribeButton}
                                >
                                    구독 신청하기
                                </Button>
                            </div>
                        }
                    />
                </div>
            )}
        </div>
    );
}
