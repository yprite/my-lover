import styled, { css } from 'styled-components';
import { PlayerRole } from '../../types';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

export const Card = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

export const Title = styled.h1`
  color: #333;
  font-size: 28px;
  margin-bottom: 20px;
  text-align: center;
`;

export const Subtitle = styled.h2`
  color: #555;
  font-size: 22px;
  margin-bottom: 15px;
`;

export const Text = styled.p`
  color: #666;
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 10px;
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.variant === 'primary' && css`
    background-color: #3498db;
    color: white;
    
    &:hover {
      background-color: #2980b9;
    }
  `}
  
  ${props => props.variant === 'secondary' && css`
    background-color: #95a5a6;
    color: white;
    
    &:hover {
      background-color: #7f8c8d;
    }
  `}
  
  ${props => props.variant === 'danger' && css`
    background-color: #e74c3c;
    color: white;
    
    &:hover {
      background-color: #c0392b;
    }
  `}
  
  ${props => !props.variant && css`
    background-color: #3498db;
    color: white;
    
    &:hover {
      background-color: #2980b9;
    }
  `}
  
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-bottom: 15px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-bottom: 15px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
`;

export const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
`;

export const Badge = styled.span<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' }>`
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  
  ${props => props.variant === 'primary' && css`
    background-color: #3498db;
    color: white;
  `}
  
  ${props => props.variant === 'secondary' && css`
    background-color: #95a5a6;
    color: white;
  `}
  
  ${props => props.variant === 'danger' && css`
    background-color: #e74c3c;
    color: white;
  `}
  
  ${props => props.variant === 'success' && css`
    background-color: #2ecc71;
    color: white;
  `}
  
  ${props => props.variant === 'warning' && css`
    background-color: #f39c12;
    color: white;
  `}
  
  ${props => !props.variant && css`
    background-color: #3498db;
    color: white;
  `}
`;

export const Divider = styled.hr`
  border: 0;
  height: 1px;
  background-color: #ddd;
  margin: 20px 0;
`;

export const Avatar = styled.div<{ bgColor?: string }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${props => props.bgColor || '#3498db'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
  margin-right: 10px;
`;

export const ChatContainer = styled.div`
  height: 400px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
`;

export const ChatInput = styled.input`
  width: 80%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

export const ChatSendButton = styled.button`
  width: 20%;
  padding: 10px;
  border: none;
  border-radius: 0 4px 4px 0;
  background-color: #3498db;
  color: white;
  font-size: 16px;
  cursor: pointer;
  
  &:hover {
    background-color: #2980b9;
  }
`;

export const Timer = styled.div`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin: 20px 0;
  color: #e74c3c;
`;

export const PlayerCard = styled.div<{ isAlive?: boolean; isSelected?: boolean }>`
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  
  ${props => !props.isAlive && css`
    opacity: 0.5;
    background-color: #f5f5f5;
  `}
  
  ${props => props.isSelected && css`
    border: 2px solid #3498db;
  `}
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

export const RoleCard = styled.div<{ roleType: PlayerRole }>`
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  text-align: center;
  
  ${props => props.roleType === 'citizen' && css`
    background-color: #3498db;
    color: white;
  `}
  
  ${props => props.roleType === 'mafia' && css`
    background-color: #e74c3c;
    color: white;
  `}
  
  ${props => props.roleType === 'doctor' && css`
    background-color: #2ecc71;
    color: white;
  `}
  
  ${props => props.roleType === 'police' && css`
    background-color: #f39c12;
    color: white;
  `}
  
  ${props => props.roleType === 'spectator' && css`
    background-color: #95a5a6;
    color: white;
  `}
`; 