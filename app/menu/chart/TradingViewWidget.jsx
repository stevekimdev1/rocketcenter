import React, { useEffect, useRef } from 'react';

const TradingViewWidget = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "colorTheme": "light",
      "dateRange": "1D",
      "showChart": true,
      "locale": "kr",
      "largeChartUrl": "",
      "isTransparent": false,
      "showSymbolLogo": true,
      "showFloatingTooltip": false,
      "width": "100%",
      "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
      "plotLineColorFalling": "rgba(41, 98, 255, 1)",
      "gridLineColor": "rgba(240, 243, 250, 0)",
      "scaleFontColor": "rgba(15, 15, 15, 1)",
      "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
      "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
      "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
      "tabs": [
        {
          "title": "지수",
          "symbols": [
            { "s": "FOREXCOM:SPXUSD", "d": "S&P 500 Index" },
            { "s": "FOREXCOM:NSXUSD", "d": "US 100 Cash CFD" },
            { "s": "FOREXCOM:DJI", "d": "Dow Jones Industrial Average Index" },
            { "s": "FX:HKG33", "d": "Hang Seng Index Cash" },
            { "s": "FTSE:UKX", "d": "FTSE 100 Index" },
            { "s": "INDEX:NKY", "d": "Japan 225" },
            { "s": "INDEX:DEU40", "d": "DAX Index" }
          ],
          "originalTitle": "Indices"
        },
        {
          "title": "원자재",
          "symbols": [
            { "s": "COMEX:GC1!", "d": "Gold" },
            { "s": "NYMEX:CL1!", "d": "WTI Crude Oil" },
            { "s": "NYMEX:NG1!", "d": "Gas" },
            { "s": "CBOT:ZC1!", "d": "Corn" }
          ],
          "originalTitle": "Futures"
        },
        {
          "title": "외환",
          "symbols": [
            { "s": "FX:EURUSD", "d": "EUR to USD" },
            { "s": "FX:GBPUSD", "d": "GBP to USD" },
            { "s": "FX:USDJPY", "d": "USD to JPY" },
            { "s": "FX:AUDUSD", "d": "AUD to USD" },
            { "s": "FX:USDCAD", "d": "USD to CAD" },
            { "s": "FX:NZDUSD", "d": "NZD to USD" },
            { "s": "FX:GBPJPY", "d": "GBP to USD" },
            { "s": "FX:GBPNZD", "d": "GBP to NZD" }
          ],
          "originalTitle": "Forex"
        },
        {
          "title": "코인",
          "symbols": [
            { "s": "BINANCE:BTCUSDT", "d": "Bitcoin/Tether" },
            { "s": "BINANCE:ETHUSDT", "d": "Ethereum/Tether" },
            { "s": "BINANCE:XRPUSDT", "d": "Ripple/Tether" },
            { "s": "BINANCE:SOLUSDT", "d": "Solana/Tether" },
            { "s": "BINANCE:DOGEUSDT", "d": "Doge Coin/Tether" },
            { "s": "BINANCE:ADAUSDT", "d": "Cardano/Tether" },
            { "s": "BINANCE:AVAXUSDT", "d": "Avalanche/Tether" },
            { "s": "BINANCE:SUIUSDT", "d": "Sui/Tether" },
            { "s": "BINANCE:SHIBUSDT", "d": "Shiba Inu/Tether" },
            { "s": "BINANCE:PEPEUSDT", "d": "Pepe Coin/Tether" }
          ]
        }
      ]
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ minHeight: '400px' }}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
};

export default TradingViewWidget;
