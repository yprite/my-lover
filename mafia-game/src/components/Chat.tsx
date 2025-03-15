import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { 
  ChatContainer, 
  ChatInput, 
  ChatSendButton, 
  FlexRow, 
  Text, 
  Card 
} from './styled';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // 새 메시지가 오면 스크롤을 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  return (
    <div>
      <ChatContainer ref={chatContainerRef}>
        {messages.map(msg => (
          <Card 
            key={msg.id} 
            style={{ 
              padding: '10px', 
              marginBottom: '10px',
              backgroundColor: msg.isSystemMessage ? '#f8f9fa' : 'white',
              borderLeft: msg.isSystemMessage ? '3px solid #e74c3c' : 'none'
            }}
          >
            <Text style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {msg.senderName} {msg.isSystemMessage && '(시스템)'}
            </Text>
            <Text>{msg.content}</Text>
            <Text style={{ fontSize: '12px', color: '#aaa', textAlign: 'right' }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </Text>
          </Card>
        ))}
        {messages.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#aaa', marginTop: '20px' }}>
            메시지가 없습니다.
          </Text>
        )}
      </ChatContainer>
      
      <FlexRow>
        <ChatInput
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "현재 채팅을 사용할 수 없습니다." : "메시지를 입력하세요..."}
          disabled={disabled}
        />
        <ChatSendButton onClick={handleSendMessage} disabled={disabled}>
          전송
        </ChatSendButton>
      </FlexRow>
    </div>
  );
};

export default Chat; 