import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";

// El componente ahora espera una prop llamada 'works'
const ImageCarousel = ({ works }) => {
    return (
        <>
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop={true}
                autoplay={{ delay: 7000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                navigation={true}
                pagination={{ clickable: true }}
                slidesPerView={1}
                spaceBetween={30}
                className="relative group"
            >
                {works.map((work, index) => (
                    <SwiperSlide key={index}>
                        <div className="relative w-full aspect-video text-white">
                            <img src={work.src} alt={work.alt} className="w-full h-full object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>

                            <div className="absolute bottom-0 left-0 p-6 md:p-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-yellow-300 font-serif mb-3">{work.title}</h2>
                                <p className="text-lg text-gray-200 max-w-2xl">{work.summary}</p>
                                <button className="mt-4 font-semibold text-yellow-400 hover:text-white transition">Ver detalles →</button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}

                <div className="swiper-pagination"></div>
            </Swiper>
            <style jsx global>{`
                .swiper-pagination-bullet { background: rgba(255, 255, 255, 0.5) !important; width: 10px; height: 10px; }
                .swiper-pagination-bullet-active { background: #fBBF24 !important; }
                .swiper-button-next::after, .swiper-button-prev::after { font-size: 1.5rem !important; font-weight: bold; }
            
            `}</style>
        </>
    );
};

export default ImageCarousel;