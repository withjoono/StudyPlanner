import { Link } from '@tanstack/react-router';

const YOUTUBE_ICON = 'https://www.youtube.com/s/desktop/f506bd45/img/favicon_32x32.png';
const NAVER_CAFE_ICON = 'https://ssl.pstatic.net/static/cafe/favicon/cafe_favicon_32x32.png';

export const Footer = () => {
  return (
    <div className="border-t bg-gray-50 py-6 sm:py-8 dark:bg-gray-900/50">
      <div className="mx-auto w-full max-w-screen-lg px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr_auto] sm:gap-10">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <img className="h-auto w-16 rounded-xl sm:w-20" src="/logo.png" alt="G Skool 로고" />
            <span className="text-base font-semibold sm:text-lg">{'(주)G Skool'}</span>
          </div>
          <div className="flex flex-col gap-3 text-center">
            <div className="flex flex-col gap-1 text-xs text-gray-500 sm:text-sm">
              <span>사업체명 (주)G Skool | 대표 강준호</span>
              <span>사업자등록번호 772-87-02782 | 연락처 042-484-3356</span>
              <span>서울시 성북구 화랑로 211 성북구 기술창업센터 105호</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-sm font-medium">
              <a
                href="https://www.geobukschool.kr/explain/service"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-blue-600"
              >
                이용약관
              </a>
              <a
                href="https://www.geobukschool.kr/explain/refund"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-blue-600"
              >
                환불규정
              </a>
              <a
                href="https://www.geobukschool.kr/explain/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:underline"
              >
                개인정보처리방침
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <div className="flex items-center gap-4">
              <a
                href="https://www.youtube.com/@turtleschool_official"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110"
              >
                <img className="h-10 w-10 rounded-lg" src={YOUTUBE_ICON} alt="YouTube" />
              </a>
              <a
                href="https://cafe.naver.com/turtlecorp"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110"
              >
                <img className="h-10 w-10 rounded-lg" src={NAVER_CAFE_ICON} alt="네이버 카페" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-2 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} (주)G Skool. All rights reserved.
        </div>
      </div>
    </div>
  );
};
