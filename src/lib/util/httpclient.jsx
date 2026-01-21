import axios from "axios";
import { serverUrl, storageKeys, urls } from '../../const';

const httpClient = axios.create({
    baseURL: serverUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

httpClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(storageKeys.accessToken);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
    response => response,
    async error => {

        if (error.config.url === urls.login) {
            return Promise.reject(error);
        }

        if (error.response && error.response.status === 401) {
            try {
                const refreshResponse = await axios.post(urls.refresh, {
                    refreshToken: localStorage.getItem(storageKeys.refreshToken),
                });

                const newAccessToken = refreshResponse.data.accessToken;

                localStorage.setItem(storageKeys.accessToken, newAccessToken);

                error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return axios(error.config);
            } catch (refreshError) {
                localStorage.removeItem(storageKeys.accessToken);
                localStorage.removeItem(storageKeys.refreshToken);
                localStorage.removeItem(storageKeys.user);

                const currentPath = window.location.pathname + window.location.search;
                localStorage.setItem(storageKeys.returnUrl, currentPath);
                
                window.location.href = '/login';
                
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default httpClient;