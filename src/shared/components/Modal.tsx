'use client'
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  /** 모달 흰 패널에 추가할 Tailwind 클래스 (max-w, max-h, padding 등) */
  contentClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  contentClassName,
}) => {

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
    <div
      onClick={() => onClose?.() ?? undefined}
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          contentClassName
            ? `relative rounded-md shadow-lg ${contentClassName}`
            : "relative w-full max-w-lg rounded-md bg-white py-4 px-8 shadow-lg"
        }
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;