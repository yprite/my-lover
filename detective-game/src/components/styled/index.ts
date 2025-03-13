import styled from 'styled-components';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

export const Button = styled.button`
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin: 5px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #1a252f;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

export const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin: 10px 0;
`;

export const Title = styled.h1`
  color: #2c3e50;
  font-size: 32px;
  margin-bottom: 20px;
`;

export const Subtitle = styled.h2`
  color: #34495e;
  font-size: 24px;
  margin-bottom: 15px;
`;

export const Text = styled.p`
  color: #2c3e50;
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 10px;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
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

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  margin-bottom: 10px;
  resize: vertical;
`;

export const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  margin-bottom: 10px;
  width: 100%;
`;

export const Badge = styled.span`
  background-color: #3498db;
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  margin-right: 10px;
`;

export const Divider = styled.hr`
  border: 0;
  height: 1px;
  background-color: #ddd;
  margin: 20px 0;
`; 