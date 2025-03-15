import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Title, Input, Button, Text } from '../components/styled';
import { useUser } from '../contexts/UserContext';
import { useSocket } from '../contexts/SocketContext';

const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!isConnected) {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(name.trim());
      if (success) {
        navigate('/lobby');
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };
  
  return (
    <Container>
      <Card style={{ maxWidth: '500px', margin: '100px auto' }}>
        <Title>마피아 게임</Title>
        
        <Text>게임에 참여할 이름을 입력하세요:</Text>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="이름"
          maxLength={10}
          disabled={isLoading}
        />
        
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
        {!isConnected && <Text style={{ color: 'orange' }}>서버에 연결 중입니다...</Text>}
        
        <Button onClick={handleLogin} disabled={isLoading || !isConnected}>
          {isLoading ? '로그인 중...' : '게임 참여하기'}
        </Button>
      </Card>
    </Container>
  );
};

export default LoginPage; 