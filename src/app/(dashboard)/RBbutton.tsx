'use client'
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface RBButtonProps {
    color: 'gray' | 'blue';
    children: React.ReactNode;
    onClick: (value: any) => any;
}

const RBButton: React.FC<RBButtonProps> = ({ color, children, onClick }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // 클라이언트 측에서만 document 사용 가능
        setIsClient(true);

    }, []);

    if (!isClient) return null;


    return ReactDOM.createPortal(
        <div className='relative'>
            <div className='absolute h-full -right-12 flex flex-col-reverse'>
                <div className={`bg-${color}-400 sticky bottom-12 mb-6 flex w-12 h-12 rounded-full text-3xl text-white justify-center items-center z-50 cursor-pointer`}
                    onClick={onClick}>
                    {children}
                </div>
            </div>
        </div>
        ,
        document.getElementsByTagName('main')[0] // 클라이언트에서만 `document`를 사용할 수 있음
    );
};

export default RBButton;