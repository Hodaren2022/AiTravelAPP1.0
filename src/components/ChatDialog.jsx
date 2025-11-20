import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAIAssistant } from '../contexts/AIAssistantContext';
import aiService, { AIServiceError } from '../services/aiService';
import { networkMonitor, getNetworkDiagnostics, formatDiagnosticsForDisplay } from '../utils/networkUtils';
import MarkdownRenderer from './MarkdownRenderer';

// 對話框容器
const DialogContainer = styled.div`
  position: fixed;
  z-index: 10000;
  width: 350px;
  max-height: 500px;
  background-color: var(--theme-1, white);
  border: 1px solid var(--theme-3, #ddd);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  @media (max-width: 768px) {
    width: calc(100vw - 2rem);
    max-height: 60vh;
    left: 1rem !important;
    right: 1rem !important;
  }
`;

// 對話框標題欄
const DialogHeader = styled.div`
  background-color: var(--theme-2, #3498db);
  color: var(--theme-4, white);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-h4, 16px);
  font-weight: 600;
`;

// 標題左側區域
const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// 標題右側按鈕區域
const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// 新對話按鈕
const NewConversationButton = styled.button`
  background: none;
  border: none;
  color: var(--theme-4, white);
  font-size: 14px;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

// 關閉按鈕
const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--theme-4, white);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

// 消息列表容器
const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  max-height: 300px;
  touch-action: pan-y; /* 只允許垂直滾動 */
  
  /* 自定義滾動條 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
`;

// 消息氣泡
const MessageBubble = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div`
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  font-size: var(--font-size-body, 14px);
  line-height: 1.4;
  word-wrap: break-word;
  
  ${props => {
    if (props.$isUser) {
      return `
        background-color: var(--theme-2, #3498db);
        color: var(--theme-4, white);
        border-bottom-right-radius: 6px;
      `;
    } else if (props.$isSystem) {
      return `
        background-color: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
        border-bottom-left-radius: 6px;
        font-style: italic;
      `;
    } else {
      return `
        background-color: #f1f3f4;
        color: #333;
        border-bottom-left-radius: 6px;
      `;
    }
  }}
  
  /* 引文樣式 */
  a {
    color: var(--theme-2, #3498db);
    text-decoration: none;
    font-weight: 500;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s ease;
    
    &:hover {
      text-decoration: underline;
      background-color: rgba(52, 152, 219, 0.1);
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
`;

// 搜索元數據顯示
const SearchMetadata = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 8px;
  font-size: var(--font-size-small, 12px);
  color: #666;
`;

const SearchQueries = styled.div`
  margin-bottom: 0.25rem;
  
  strong {
    color: #333;
  }
`;

const SourcesList = styled.div`
  margin-top: 0.25rem;
  
  .source-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.125rem;
    
    .source-number {
      background-color: var(--theme-2, #3498db);
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    
    .source-link {
      color: var(--theme-2, #3498db);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
      
      &:hover {
        text-decoration: underline;
        color: var(--theme-accent, #2980b9);
      }
    }
    
    .source-domain {
      color: #999;
      font-size: 10px;
      margin-left: auto;
    }
    
    &:hover .source-number {
      background-color: var(--theme-accent, #2980b9);
      transform: scale(1.1);
    }
  }
`;

const MessageTime = styled.div`
  font-size: var(--font-size-small, 12px);
  color: #666;
  margin-top: 0.25rem;
  padding: 0 0.5rem;
`;

// 輸入區域
const InputContainer = styled.div`
  border-top: 1px solid var(--theme-3, #ddd);
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--theme-3, #ddd);
  border-radius: 20px;
  font-size: var(--font-dy, 14px);
  outline: none;
  transform: scale(1);
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: var(--theme-2, #3498db);
    transform: scale(1);
    font-size: var(--font-dy, 14px);
  }
  
  &::placeholder {
    color: #999;
  }
  
  /* 禁用移動設備上的自動縮放 */
  @media screen and (max-width: 768px) {
    font-size: 16px; /* 防止iOS Safari自動縮放 */
    
    &:focus {
      font-size: 16px;
      transform: scale(1);
    }
  }
`;

const SendButton = styled.button`
  background-color: var(--theme-2, #3498db);
  color: var(--theme-4, white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: var(--theme-accent, #2980b9);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 載入指示器
const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #666;
  font-size: var(--font-size-small, 12px);
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 2px;
  
  span {
    width: 4px;
    height: 4px;
    background-color: #666;
    border-radius: 50%;
    animation: loading 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
  
  @keyframes loading {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

// 確認對話框樣式
const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
`;

const ConfirmDialogContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const ConfirmDialogTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const ConfirmDialogMessage = styled.p`
  margin: 0 0 1.5rem 0;
  color: #666;
  line-height: 1.5;
`;

const ConfirmDialogButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const ConfirmButton = styled.button`
  background-color: var(--theme-2, #3498db);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--theme-accent, #2980b9);
  }
`;

const CancelButton = styled.button`
  background-color: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
`;

const ChatDialog = () => {
  const {
    isOpen,
    isLoading,
    position,
    messages,
    closeDialog,
    addUserMessage,
    addAIMessage,
    addSystemMessage,
    setLoadingState,
    processAISuggestions,
    startNewConversation,
    MESSAGE_TYPES
  } = useAIAssistant();

  const [inputValue, setInputValue] = React.useState('');
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [networkStatus, setNetworkStatus] = React.useState(networkMonitor.getStatus());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 自動滾動到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // 聚焦輸入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  // 處理發送消息
  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = inputValue.trim();
      addUserMessage(userMessage);
      setInputValue('');
      setLoadingState(true);
      
      try {
        console.log('ChatDialog: 開始發送消息:', userMessage);
        
        // 調用AI服務，傳入對話歷史
        const response = await aiService.sendMessageWithContext(userMessage, messages);
        
        console.log('ChatDialog: 收到AI回應:', response);
        
        // 添加AI回應，包含搜索元數據
        addAIMessage(response.content, response.suggestions, response.groundingMetadata);
        
        // 如果有數據修改建議，處理確認流程
        if (response.suggestions && response.suggestions.length > 0) {
          processAISuggestions(response.suggestions);
        }
        
      } catch (error) {
        console.error('ChatDialog: AI service error:', error);
        console.error('ChatDialog: 錯誤詳情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        if (error instanceof AIServiceError) {
          if (error.message.includes('取消')) {
            // 請求被取消，不顯示錯誤
            return;
          }
          addSystemMessage(`錯誤：${error.message}`);
        } else {
          // 獲取網路診斷信息
          getNetworkDiagnostics().then(diagnostics => {
            const diagnosticsText = formatDiagnosticsForDisplay(diagnostics);
            addSystemMessage(`發生未知錯誤。網路診斷信息：\n${diagnosticsText}`);
          }).catch(() => {
            addSystemMessage('抱歉，發生了未知錯誤。請稍後再試。');
          });
        }
      } finally {
        setLoadingState(false);
      }
    }
  };

  // 處理Enter鍵發送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 處理新對話按鈕點擊
  const handleNewConversation = () => {
    if (messages.length > 0) {
      setShowConfirmDialog(true);
    } else {
      startNewConversation();
    }
  };

  // 確認開始新對話
  const confirmNewConversation = () => {
    startNewConversation();
    setShowConfirmDialog(false);
  };

  // 取消新對話
  const cancelNewConversation = () => {
    setShowConfirmDialog(false);
  };

  // 組件卸載時取消請求和清理網路監聽器
  useEffect(() => {
    // 網路狀態監聽器
    const handleNetworkChange = (status, isOnline) => {
      setNetworkStatus(networkMonitor.getStatus());
      if (!isOnline) {
        addSystemMessage('網路連接已斷開，請檢查您的網路連接');
      } else {
        addSystemMessage('網路連接已恢復');
      }
    };
    
    networkMonitor.addListener(handleNetworkChange);
    
    return () => {
      aiService.cancelRequest();
      networkMonitor.removeListener(handleNetworkChange);
    };
  }, [addSystemMessage]);

  // 格式化時間
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化消息內容，將 Markdown 連結轉換為 HTML
  const formatMessageContent = (content) => {
    if (!content) return '';
    
    // 將 Markdown 連結 [text](url "title") 轉換為 HTML
    return content.replace(
      /\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" title="$3">$1</a>'
    );
  };

  // 計算對話框位置
  const getDialogPosition = () => {
    const dialogWidth = window.innerWidth <= 768 ? window.innerWidth - 32 : 350;
    const dialogHeight = 500;
    
    let left = position.x - dialogWidth - 10; // 預設顯示在按鈕左側
    let top = position.y - dialogHeight / 2;
    
    // 邊界檢查
    if (left < 10) {
      left = position.x + 70; // 顯示在按鈕右側
    }
    if (top < 10) {
      top = 10;
    }
    if (top + dialogHeight > window.innerHeight - 10) {
      top = window.innerHeight - dialogHeight - 10;
    }
    
    return { left, top };
  };

  if (!isOpen) return null;

  const dialogPosition = getDialogPosition();

  return (
    <DialogContainer
      style={{
        left: `${dialogPosition.left}px`,
        top: `${dialogPosition.top}px`,
      }}
    >
      <DialogHeader>
        <HeaderLeft>
          <span>AI 旅行助手</span>
        </HeaderLeft>
        <HeaderButtons>
          <NewConversationButton 
            onClick={handleNewConversation} 
            title="開始新對話"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
            新對話
          </NewConversationButton>
          <CloseButton onClick={closeDialog} title="關閉">
            ×
          </CloseButton>
        </HeaderButtons>
      </DialogHeader>
      
      <MessagesContainer>
        {messages.length === 0 ? (
          <MessageBubble $isUser={false}>
            <MessageContent $isUser={false}>
              <MarkdownRenderer content="您好！我是您的**AI旅行助手**。我可以幫助您：

## 主要功能
- **行程管理** - 協助規劃和編輯旅行計劃
- **旅遊資訊** - 提供景點、交通、住宿建議  
- **數據編輯** - 幫助管理您的旅行數據

*有什麼可以為您服務的嗎？*" />
            </MessageContent>
          </MessageBubble>
        ) : (
          messages.map((message, index) => (
            <MessageBubble 
              key={`${message.id}_${index}_${message.timestamp}`} 
              $isUser={message.type === MESSAGE_TYPES.USER}
            >
              {message.type === MESSAGE_TYPES.USER || message.type === MESSAGE_TYPES.SYSTEM ? (
                <MessageContent 
                  $isUser={message.type === MESSAGE_TYPES.USER}
                  $isSystem={message.type === MESSAGE_TYPES.SYSTEM}
                  dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                />
              ) : (
                <MessageContent 
                  $isUser={false}
                  $isSystem={false}
                >
                  <MarkdownRenderer content={message.content} />
                </MessageContent>
              )}
              
              {/* 顯示搜索元數據 */}
              {message.groundingMetadata && message.groundingMetadata.hasGrounding && (
                <SearchMetadata>
                  {message.groundingMetadata.searchQueries && message.groundingMetadata.searchQueries.length > 0 && (
                    <SearchQueries>
                      <strong>搜索查詢：</strong>
                      {message.groundingMetadata.searchQueries.join(', ')}
                    </SearchQueries>
                  )}
                  
                  {message.groundingMetadata.sources && message.groundingMetadata.sources.length > 0 && (
                    <SourcesList>
                      <strong>參考來源：</strong>
                      {message.groundingMetadata.sources.map((source, index) => (
                        <div key={`${source.id}_${index}_${source.url}`} className="source-item">
                          <span className="source-number">{index + 1}</span>
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="source-link"
                            title={source.title}
                          >
                            {source.title}
                          </a>
                          <span className="source-domain">({source.domain})</span>
                        </div>
                      ))}
                    </SourcesList>
                  )}
                </SearchMetadata>
              )}
              
              <MessageTime>
                {formatTime(message.timestamp)}
              </MessageTime>
            </MessageBubble>
          ))
        )}
        
        {isLoading && (
          <LoadingIndicator>
            <LoadingDots>
              <span></span>
              <span></span>
              <span></span>
            </LoadingDots>
            AI正在思考中...
          </LoadingIndicator>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <MessageInput
          ref={inputRef}
          type="text"
          placeholder="輸入您的問題..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <SendButton
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          title="發送消息"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </SendButton>
      </InputContainer>

      {/* 新對話確認對話框 */}
      {showConfirmDialog && (
        <ConfirmDialog>
          <ConfirmDialogContent>
            <ConfirmDialogTitle>開始新對話</ConfirmDialogTitle>
            <ConfirmDialogMessage>
              確定要清除當前對話歷史並開始新對話嗎？此操作無法撤銷。
            </ConfirmDialogMessage>
            <ConfirmDialogButtons>
              <ConfirmButton onClick={confirmNewConversation}>
                確定
              </ConfirmButton>
              <CancelButton onClick={cancelNewConversation}>
                取消
              </CancelButton>
            </ConfirmDialogButtons>
          </ConfirmDialogContent>
        </ConfirmDialog>
      )}
    </DialogContainer>
  );
};

export default ChatDialog;