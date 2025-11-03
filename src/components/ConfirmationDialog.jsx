import React, { useState } from 'react';
import styled from 'styled-components';
import { useAIAssistant } from '../contexts/AIAssistantContext';
import ChangePreview from './ChangePreview';

// 確認對話框遮罩
const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

// 確認對話框容器
const DialogContainer = styled.div`
  background-color: var(--theme-1, white);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    max-width: 95vw;
    max-height: 90vh;
  }
`;

// 對話框標題欄
const DialogHeader = styled.div`
  background-color: var(--theme-2, #3498db);
  color: var(--theme-4, white);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// 標題文字
const DialogTitle = styled.h2`
  margin: 0;
  font-size: var(--font-size-h4, 18px);
  font-weight: 600;
`;

// 變更統計
const ChangeStats = styled.div`
  font-size: var(--font-size-small, 12px);
  opacity: 0.9;
`;

// 關閉按鈕
const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--theme-4, white);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

// 對話框內容
const DialogContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  
  /* 自定義滾動條 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
`;

// 批量操作區域
const BatchActions = styled.div`
  border-top: 1px solid var(--theme-3, #ddd);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
`;

// 批量操作按鈕
const BatchButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: var(--font-size-body, 14px);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.$primary ? `
    background-color: var(--theme-2, #3498db);
    color: var(--theme-4, white);
    
    &:hover:not(:disabled) {
      background-color: var(--theme-accent, #2980b9);
    }
  ` : props.$danger ? `
    background-color: #e74c3c;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #c0392b;
    }
  ` : `
    background-color: #6c757d;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #5a6268;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 進度指示器
const ProgressIndicator = styled.div`
  font-size: var(--font-size-small, 12px);
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// 空狀態提示
const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  p {
    margin: 0;
    font-size: var(--font-size-body, 14px);
  }
`;

const ConfirmationDialog = () => {
  const {
    showConfirmation,
    pendingChanges,
    rejectChanges,
    confirmChanges
  } = useAIAssistant();

  const [processingChanges, setProcessingChanges] = useState(new Set());
  const [processedChanges, setProcessedChanges] = useState(new Set());

  // 處理單個變更確認
  const handleApproveChange = async (change) => {
    setProcessingChanges(prev => new Set([...prev, change.id]));
    
    try {
      // 這裡會調用實際的數據修改邏輯
      await confirmChanges([change]);
      setProcessedChanges(prev => new Set([...prev, change.id]));
    } catch (error) {
      console.error('Error applying change:', error);
      // 可以添加錯誤提示
    } finally {
      setProcessingChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(change.id);
        return newSet;
      });
    }
  };

  // 處理單個變更拒絕
  const handleRejectChange = (change) => {
    setProcessedChanges(prev => new Set([...prev, change.id]));
  };

  // 批量確認所有變更
  const handleApproveAll = async () => {
    const remainingChanges = pendingChanges.filter(
      change => !processedChanges.has(change.id)
    );
    
    if (remainingChanges.length === 0) return;
    
    try {
      await confirmChanges(remainingChanges);
      // 關閉對話框
      rejectChanges();
    } catch (error) {
      console.error('Error applying all changes:', error);
    }
  };

  // 批量拒絕所有變更
  const handleRejectAll = () => {
    rejectChanges();
  };

  // 關閉對話框
  const handleClose = () => {
    rejectChanges();
  };

  if (!showConfirmation || !pendingChanges || pendingChanges.length === 0) {
    return null;
  }

  const remainingChanges = pendingChanges.filter(
    change => !processedChanges.has(change.id)
  );
  const completedCount = pendingChanges.length - remainingChanges.length;
  const isProcessing = processingChanges.size > 0;

  return (
    <DialogOverlay onClick={handleClose}>
      <DialogContainer onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <div>
            <DialogTitle>確認數據變更</DialogTitle>
            <ChangeStats>
              {completedCount > 0 && `已處理 ${completedCount} 項，`}
              剩餘 {remainingChanges.length} 項變更待確認
            </ChangeStats>
          </div>
          <CloseButton onClick={handleClose} title="關閉">
            ×
          </CloseButton>
        </DialogHeader>
        
        <DialogContent>
          {remainingChanges.length === 0 ? (
            <EmptyState>
              <h3>✅ 所有變更已處理完成</h3>
              <p>您可以關閉此對話框繼續使用AI助手</p>
            </EmptyState>
          ) : (
            remainingChanges.map((change) => (
              <ChangePreview
                key={change.id}
                change={change}
                onApprove={handleApproveChange}
                onReject={handleRejectChange}
                isProcessing={processingChanges.has(change.id)}
              />
            ))
          )}
        </DialogContent>
        
        {remainingChanges.length > 0 && (
          <BatchActions>
            <ProgressIndicator>
              <span>進度：{completedCount}/{pendingChanges.length}</span>
              {isProcessing && <span>⏳ 處理中...</span>}
            </ProgressIndicator>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <BatchButton onClick={handleRejectAll} disabled={isProcessing}>
                全部拒絕
              </BatchButton>
              <BatchButton 
                $primary 
                onClick={handleApproveAll} 
                disabled={isProcessing}
              >
                確認全部
              </BatchButton>
            </div>
          </BatchActions>
        )}
      </DialogContainer>
    </DialogOverlay>
  );
};

export default ConfirmationDialog;