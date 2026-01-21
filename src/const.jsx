export const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
export const mainUrl = process.env.NEXT_PUBLIC_MAIN_URL;
export const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
export const storageKeys = {
    accessToken: "rocketCenterUser:accessToken",
    refreshToken: "rocketCenterUser:refreshToken",
    returnUrl: "rocketCenterUser:returnUrl",
    user: 'rocketCenterUser:user',
    loginId: 'rocketCenterUser:loginId',
    favoriteStock: 'rocketCenterUser:favoriteStock',
}

export const urls = {
    login: `${serverUrl}/auth/login`,
    refresh: `${serverUrl}/auth/refresh`,
    validation: `${serverUrl}/auth/validation?token=%s`,
    mailVerify: `${serverUrl}/user/signup/verify/%s`,
    signup: `${serverUrl}/user/signup`,
    signupResend: `${serverUrl}/user/signup/resend`,
    checkId: `${serverUrl}/user/signup/checkId`,
    myinfo: `${serverUrl}/user/myinfo`,
    emailCodeDispatch: `${serverUrl}/emailVerify/dispatch`,
    emailCodeVerify: `${serverUrl}/emailVerify/verify?token=%s&code=%s`,
    findPassword: `${serverUrl}/user/find/password`,
    withdraw: `${serverUrl}/user/withdraw`,
    modifyPassword: `${serverUrl}/user/myinfo/modify`,
    referrerHistory: `${serverUrl}/payment/referral/list`,
    commissionHistory: `${serverUrl}/payment/commission/list`,
    paymentHistory: `${serverUrl}/payment/list?pageNum=%s&pageSize=%s`,
    paymentCancel: `${serverUrl}/payment/cancel/%s`,
    boardList: `${serverUrl}/board/list?pageNum=%s&pageSize=%s&category=%s`,
    boardCreate: `${serverUrl}/board/create`,
    boardModify: `${serverUrl}/board/modify`,
    signalMyStockItem: `${serverUrl}/signal/my-stock-items`,
    signalAllStockItem: `${serverUrl}/signal/all-stock-items`,
    signalChartData: `${serverUrl}/signal/chart-data?itemCode=%s&interval=%s&from=%s&to=%s`,
    signalChartDataLast1M: `${serverUrl}/signal/chart-data/last1m/%s`,
    signalChartSignalData: `${serverUrl}/signal/chart-signal-data?itemCode=%s&from=%s&to=%s`,
    signalList: `${serverUrl}/signal/signal-list/%s?pageNum=%s&pageSize=%s`,
    subscriptionList: `${serverUrl}/subscription/list`,
    subscriptionStockList: `${serverUrl}/subscription/stock/list`,
    subscriptionPeriodList: `${serverUrl}/subscription/period/list`,
    subscriptionCreate: `${serverUrl}/payment/request`,
    globalSetting: `${serverUrl}/system/setting`,
    globalSettingItem: `${serverUrl}/system/setting/%s`,
    uploadFile: `${serverUrl}/image/upload`,
    getFile: `${serverUrl}/image/file/%s`,
    alarmList: `${serverUrl}/alarm/list?pageNum=%s&pageSize=%s`,
    alarmNewCount: `${serverUrl}/alarm/new-count`,

}

export const getImageUrl = (idx) => {
    return `${serverUrl}/image/file/${idx}`;
}
