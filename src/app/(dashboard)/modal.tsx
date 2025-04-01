'use client'
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {

  useEffect(() => {

    // 모달이 열리면 body 스크롤을 잠그고, 모달이 닫히면 해제
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // 컴포넌트가 언마운트되거나 모달이 닫힐 때 스크롤 잠금을 해제
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null; // 서버에서는 렌더링하지 않음

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="relative bg-white py-4 px-8 rounded-md shadow-lg max-w-lg w-full">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;