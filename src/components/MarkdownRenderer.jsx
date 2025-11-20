import React from 'react';
import styled from 'styled-components';

// Markdown 渲染器容器
const MarkdownContainer = styled.div`
  line-height: 1.6;
  color: inherit;
  
  /* 標題樣式 */
  h1, h2, h3, h4, h5, h6 {
    margin: 1rem 0 0.5rem 0;
    font-weight: 600;
    line-height: 1.3;
    color: inherit;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  h1 {
    font-size: 1.5em;
    border-bottom: 2px solid #e1e4e8;
    padding-bottom: 0.3rem;
  }
  
  h2 {
    font-size: 1.3em;
    border-bottom: 1px solid #e1e4e8;
    padding-bottom: 0.2rem;
  }
  
  h3 {
    font-size: 1.2em;
  }
  
  h4 {
    font-size: 1.1em;
  }
  
  h5, h6 {
    font-size: 1em;
  }
  
  /* 段落樣式 */
  p {
    margin: 0.8rem 0;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* 列表樣式 */
  ul, ol {
    margin: 0.8rem 0;
    padding-left: 1.5rem;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  li {
    margin: 0.3rem 0;
    
    /* 嵌套列表 */
    ul, ol {
      margin: 0.3rem 0;
    }
  }
  
  /* 無序列表項目符號 */
  ul li {
    list-style-type: disc;
    
    ul li {
      list-style-type: circle;
      
      ul li {
        list-style-type: square;
      }
    }
  }
  
  /* 有序列表 */
  ol li {
    list-style-type: decimal;
  }
  
  /* 強調文字 */
  strong, b {
    font-weight: 600;
    color: inherit;
  }
  
  em, i {
    font-style: italic;
    color: inherit;
  }
  
  /* 代碼樣式 */
  code {
    background-color: rgba(175, 184, 193, 0.2);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9em;
  }
  
  /* 代碼塊 */
  pre {
    background-color: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem 0;
    overflow-x: auto;
    
    code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
    }
  }
  
  /* 引用塊 */
  blockquote {
    border-left: 4px solid #dfe2e5;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #6a737d;
    font-style: italic;
  }
  
  /* 分隔線 */
  hr {
    border: none;
    border-top: 1px solid #e1e4e8;
    margin: 1.5rem 0;
  }
  
  /* 連結樣式 */
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
  
  /* 表格樣式 */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
  }
  
  th, td {
    border: 1px solid #e1e4e8;
    padding: 0.5rem;
    text-align: left;
  }
  
  th {
    background-color: #f6f8fa;
    font-weight: 600;
  }
  
  /* 響應式調整 */
  @media (max-width: 768px) {
    h1 {
      font-size: 1.3em;
    }
    
    h2 {
      font-size: 1.2em;
    }
    
    h3 {
      font-size: 1.1em;
    }
    
    ul, ol {
      padding-left: 1.2rem;
    }
    
    pre {
      padding: 0.8rem;
      font-size: 0.9em;
    }
  }
`;

/**
 * 簡單的 Markdown 解析器
 * 將 Markdown 文本轉換為 HTML
 */
class MarkdownParser {
  static parse(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return '';
    }

    let html = markdown;

    // 處理代碼塊（必須在其他處理之前）
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // 處理行內代碼
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 處理標題
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // 處理粗體和斜體
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 處理連結
    html = html.replace(/\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" title="$3">$1</a>');
    
    // 處理分隔線
    html = html.replace(/^---$/gm, '<hr>');
    
    // 處理引用塊
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    
    // 處理無序列表
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 處理有序列表
    html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    // 注意：這裡需要更複雜的邏輯來正確處理有序列表，暫時使用簡單版本
    
    // 處理段落（在所有其他處理之後）
    const lines = html.split('\n');
    const processedLines = [];
    let inList = false;
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 檢查是否在代碼塊中
      if (line.includes('<pre>')) inCodeBlock = true;
      if (line.includes('</pre>')) inCodeBlock = false;
      
      // 檢查是否在列表中
      if (line.includes('<ul>') || line.includes('<ol>')) inList = true;
      if (line.includes('</ul>') || line.includes('</ol>')) inList = false;
      
      // 如果是空行或已經是HTML標籤，直接添加
      if (!line || line.startsWith('<') || inList || inCodeBlock) {
        processedLines.push(lines[i]);
      } else {
        // 將普通文本包裝在段落標籤中
        processedLines.push(`<p>${lines[i]}</p>`);
      }
    }
    
    html = processedLines.join('\n');
    
    // 清理多餘的空段落
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/\n\s*\n/g, '\n');
    
    return html.trim();
  }
}

/**
 * Markdown 渲染組件
 * 接收 Markdown 文本並渲染為格式化的 HTML
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) {
    return null;
  }

  const htmlContent = MarkdownParser.parse(content);

  return (
    <MarkdownContainer 
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;