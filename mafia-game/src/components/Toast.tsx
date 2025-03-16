import React, { useEffect } from 'react';
import styled from 'styled-components';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const ToastContainer = styled.div<{ type: 'success' | 'error' | 'info' }>`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  z-index: 1000;
  animation: slideIn 0.3s ease-in-out;
  background-color: ${props => {
    switch (props.type) {
      case 'success':
        return '#2ecc71';
      case 'error':
        return '#e74c3c';
      case 'info':
        return '#3498db';
      default:
        return '#3498db';
    }
  }};

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <ToastContainer type={type}>
      {message}
    </ToastContainer>
  );
};

export default Toast; 