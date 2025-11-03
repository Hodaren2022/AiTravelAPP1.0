import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAIAssistant } from '../contexts/AIAssistantContext';

// 浮動按鈕容器
const FloatingButtonContainer = styled.div`
  position: fixed;
  z-index: 9999;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--theme-2, #3498db);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  user-select: none;
  touch-action: none; /* 禁用所有觸摸手勢，允許自定義拖拽 */
  
  &:hover {
    background-color: var(--theme-accent, #2980b9);
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
  }
`;

// 對話圖標
const ChatIcon = styled.svg`
  width: 28px;
  height: 28px;
  fill: var(--theme-4, white);
  pointer-events: none; /* 讓點擊事件穿透到父容器 */
  
  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
  }
`;

// 載入指示器
const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid var(--theme-4, white);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  pointer-events: none; /* 讓點擊事件穿透到父容器 */
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FloatingButton = () => {
  const { 
    isOpen, 
    isLoading, 
    position, 
    toggleDialog,
    updatePosition 
  } = useAIAssistant();

  // 拖拽相關狀態
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  // 處理按鈕點擊（只有在非拖拽狀態下才觸發）
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 如果剛剛結束拖拽，不觸發點擊
    if (isDragging) {
      return;
    }
    
    toggleDialog();
  };

  // 開始拖拽
  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });
  };

  // 拖拽中
  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return;

    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;

    // 邊界檢查
    const buttonSize = 60;
    const maxX = window.innerWidth - buttonSize;
    const maxY = window.innerHeight - buttonSize;

    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));

    updatePosition({ x: boundedX, y: boundedY });
  };

  // 結束拖拽
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      // 延遲重置拖拽狀態，避免立即觸發點擊事件
      setTimeout(() => {
        setIsDragging(false);
      }, 100);
    }
  };

  // 鼠標事件處理
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // 觸控事件處理
  const handleTouchStart = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    handleDragEnd();
  };

  // 添加全局事件監聽器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // 窗口大小改變時調整位置
  useEffect(() => {
    const handleResize = () => {
      const buttonSize = 60;
      const maxX = window.innerWidth - buttonSize;
      const maxY = window.innerHeight - buttonSize;

      if (position.x > maxX || position.y > maxY) {
        const newX = Math.min(position.x, maxX);
        const newY = Math.min(position.y, maxY);
        updatePosition({ x: newX, y: newY });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, updatePosition]);

  // 對話圖標SVG路徑
  const ChatIconPath = () => (
    <ChatIcon viewBox="0 0 24 24" style={{ pointerEvents: 'none' }}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" style={{ pointerEvents: 'none' }} />
    </ChatIcon>
  );

  return (
    <FloatingButtonContainer
      ref={buttonRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      title={isOpen ? "關閉AI助手" : "打開AI助手"}
    >
      {isLoading ? <LoadingSpinner /> : <ChatIconPath />}
    </FloatingButtonContainer>
  );
};

export default FloatingButton;