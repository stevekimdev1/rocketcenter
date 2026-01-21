import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // React Strict Mode 활성화
  async redirects() {
    return [
      {
        source: "/", // 루트 URL에 접근했을 때
        destination: '/menu/home', // 환경변수 사용
        permanent: false, // 302 (임시 리디렉트)
      },
    ];
  },
};
export default nextConfig;
