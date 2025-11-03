import React from 'react';
import styled from 'styled-components';

// 變更預覽卡片容器
const ChangeCard = styled.div`
  background-color: var(--theme-1, white);
  border: 1px solid var(--theme-3, #ddd);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// 變更標題
const ChangeTitle = styled.div`
  font-size: var(--font-size-h4, 16px);
  font-weight: 600;
  color: var(--theme-2, #2c3e50);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// 變更圖標
const ChangeIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.$type) {
      case 'add': return '#27ae60';
      case 'edit': return '#f39c12';
      case 'delete': return '#e74c3c';
      default: return '#3498db';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

// 變更描述
const ChangeDescription = styled.div`
  font-size: var(--font-size-body, 14px);
  color: #666;
  margin-bottom: 0.75rem;
  line-height: 1.4;
`;

// 變更詳情容器
const ChangeDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

// 值顯示容器
const ValueContainer = styled.div`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
`;

// 值標籤
const ValueLabel = styled.div`
  font-size: var(--font-size-small, 12px);
  color: #666;
  margin-bottom: 0.25rem;
  font-weight: 500;
`;

// 值內容
const ValueContent = styled.div`
  font-size: var(--font-size-body, 14px);
  color: #333;
  word-wrap: break-word;
  
  ${props => props.$isOld && `
    background-color: #ffebee;
    color: #c62828;
    text-decoration: line-through;
  `}
  
  ${props => props.$isNew && `
    background-color: #e8f5e8;
    color: #2e7d32;
    font-weight: 500;
  `}
  
  ${props => (props.$isOld || props.$isNew) && `
    padding: 0.25rem;
    border-radius: 3px;
    margin-top: 0.25rem;
  `}
`;

// 操作按鈕容器
const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

// 操作按鈕
const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: var(--font-size-body, 14px);
  cursor: pointer;
  transition: background-color 0.2s;
  
  ${props => props.$primary ? `
    background-color: var(--theme-2, #3498db);
    color: var(--theme-4, white);
    
    &:hover {
      background-color: var(--theme-accent, #2980b9);
    }
  ` : `
    background-color: #f8f9fa;
    color: #666;
    border: 1px solid #ddd;
    
    &:hover {
      background-color: #e9ecef;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 變更類型圖標映射
const getChangeIcon = (type) => {
  switch (type) {
    case 'add': return '+';
    case 'edit': return '✎';
    case 'delete': return '×';
    default: return '•';
  }
};

// 格式化值顯示
const formatValue = (value) => {
  if (value === null || value === undefined) {
    return '(空值)';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === 'string' && value.trim() === '') {
    return '(空字串)';
  }
  return String(value);
};

const ChangePreview = ({ 
  change, 
  onApprove, 
  onReject, 
  isProcessing = false 
}) => {
  const {
    id,
    type = 'edit',
    field,
    oldValue,
    newValue,
    description,
    category
  } = change;

  const handleApprove = () => {
    onApprove(change);
  };

  const handleReject = () => {
    onReject(change);
  };

  return (
    <ChangeCard>
      <ChangeTitle>
        <ChangeIcon $type={type}>
          {getChangeIcon(type)}
        </ChangeIcon>
        {field || '數據變更'}
        {category && (
          <span style={{ 
            fontSize: 'var(--font-size-small, 12px)', 
            color: '#666',
            fontWeight: 'normal'
          }}>
            ({category})
          </span>
        )}
      </ChangeTitle>
      
      {description && (
        <ChangeDescription>
          {description}
        </ChangeDescription>
      )}
      
      <ChangeDetails>
        {type !== 'add' && (
          <ValueContainer>
            <ValueLabel>原始值</ValueLabel>
            <ValueContent $isOld>
              {formatValue(oldValue)}
            </ValueContent>
          </ValueContainer>
        )}
        
        {type !== 'delete' && (
          <ValueContainer>
            <ValueLabel>{type === 'add' ? '新增值' : '新值'}</ValueLabel>
            <ValueContent $isNew>
              {formatValue(newValue)}
            </ValueContent>
          </ValueContainer>
        )}
      </ChangeDetails>
      
      <ActionButtons>
        <ActionButton 
          onClick={handleReject}
          disabled={isProcessing}
        >
          拒絕
        </ActionButton>
        <ActionButton 
          $primary 
          onClick={handleApprove}
          disabled={isProcessing}
        >
          {isProcessing ? '處理中...' : '確認'}
        </ActionButton>
      </ActionButtons>
    </ChangeCard>
  );
};

export default ChangePreview;