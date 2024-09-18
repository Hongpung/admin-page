import { useState, useEffect } from 'react';

export default function LoadingDots() {
    const [dots, setDots] = useState(''); // 현재 보여줄 점 상태

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length < 3 ? prev + '.' : '.')); // 점을 추가하고, 3개가 되면 초기화
        }, 500); // 0.5초마다 업데이트

        return () => clearInterval(interval); // 컴포넌트 언마운트 시 interval 정리
    }, []);

    return (
        <div className="text-center flex-grow flex items-center justify-center font-bold  text-4xl text-gray-500 bg-slate-50">
            {dots}
        </div>
    );
}