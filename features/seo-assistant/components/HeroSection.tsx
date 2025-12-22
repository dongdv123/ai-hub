import React from 'react';

const Feature: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center text-left bg-white/5 p-3 rounded-lg ring-1 ring-white/10 hover:bg-white/10 transition-colors duration-300">
    <div className="flex-shrink-0 text-teal-400">
      {icon}
    </div>
    <span className="ml-3 text-sm font-medium text-gray-200">{text}</span>
  </div>
);

const HeroSection: React.FC = () => {
  return (
    <div className="text-center p-8 mb-8 bg-gradient-to-br from-gray-900 via-slate-800 to-teal-900 rounded-xl shadow-2xl border border-teal-500/30 text-white relative">
        <div className="relative z-10">
            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                Trợ Lý SEO AI Cho Seller Etsy
            </h2>
             <p className="mt-4 text-2xl font-light text-teal-300">Phân Tích Chuyên Sâu. Tối Ưu Thông Minh.</p>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-300 leading-8">
                Công cụ này được thiết kế để hỗ trợ, không phải để thay thế sự sáng tạo của bạn. Dựa trên phân tích dữ liệu mạnh mẽ, bạn sẽ nhận được những hiểu biết sâu sắc về thị trường, kiểm toán SEO chi tiết và các gói chiến lược hành động. Hãy đưa ra quyết định dựa trên dữ liệu để cải thiện thứ hạng, thu hút đúng khách hàng và phát triển gian hàng của bạn một cách bền vững.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                <Feature 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>}
                    text="Phân tích thị trường sâu sắc"
                />
                <Feature 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>}
                    text="Kiểm toán SEO toàn diện"
                />
                <Feature 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>}
                    text="6 chiến lược tối ưu độc quyền"
                />
                <Feature 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>}
                    text="Tăng hạng & bứt phá doanh thu"
                />
            </div>
        </div>
    </div>
  );
};

export default HeroSection;

