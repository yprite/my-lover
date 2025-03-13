import { GameCase } from '../types';

export const sampleCase: GameCase = {
  id: 'case-001',
  title: '저택의 비밀',
  description: '부유한 사업가 김재원이 자신의 저택에서 살해당했습니다. 당신은 이 사건을 해결하기 위해 파견된 형사입니다.',
  introText: '2023년 5월 15일 밤, 부유한 사업가 김재원이 자신의 저택에서 살해당했습니다. 시체는 서재에서 발견되었으며, 머리에 둔기로 맞은 흔적이 있습니다. 당신은 이 사건을 해결하기 위해 파견된 형사입니다. 모든 증거를 수집하고 용의자들을 심문하여 진실을 밝혀내세요.',
  conclusionText: '축하합니다! 당신은 김재원 살인 사건의 진실을 밝혀냈습니다. 김재원의 비서 이지현이 범인이었습니다. 그녀는 김재원이 회사 자금을 횡령한 것을 발견하고 이를 폭로하겠다고 협박했습니다. 이지현은 자신의 범행을 숨기기 위해 김재원을 살해했습니다.',
  solution: 'character-002',
  
  characters: [
    {
      id: 'character-001',
      name: '김재원',
      description: '피해자. 40대 중반의 부유한 사업가. 여러 기업을 소유하고 있으며, 최근 몇몇 의심스러운 거래에 연루되었다는 소문이 있습니다.',
      isVictim: true,
      isCulprit: false
    },
    {
      id: 'character-002',
      name: '이지현',
      description: '김재원의 비서. 30대 초반의 여성. 5년 동안 김재원과 함께 일해왔으며, 그의 모든 일정과 비즈니스 거래를 관리했습니다.',
      isVictim: false,
      isCulprit: true
    },
    {
      id: 'character-003',
      name: '박서연',
      description: '김재원의 아내. 30대 후반의 여성. 결혼 생활이 불행하다는 소문이 있으며, 최근 이혼을 고려하고 있었다고 합니다.',
      isVictim: false,
      isCulprit: false
    },
    {
      id: 'character-004',
      name: '최준호',
      description: '김재원의 사업 파트너. 40대 초반의 남성. 최근 김재원과 사업상 갈등이 있었다고 합니다.',
      isVictim: false,
      isCulprit: false
    },
    {
      id: 'character-005',
      name: '김민수',
      description: '김재원의 아들. 20대 중반의 남성. 아버지와의 관계가 좋지 않았으며, 상속에 관심이 많았다고 합니다.',
      isVictim: false,
      isCulprit: false
    }
  ],
  
  locations: [
    {
      id: 'location-001',
      name: '서재',
      description: '김재원이 살해된 장소. 책장, 책상, 안락의자가 있으며, 벽에는 고가의 미술품이 걸려 있습니다.',
      clues: ['clue-001', 'clue-002', 'clue-003']
    },
    {
      id: 'location-002',
      name: '거실',
      description: '넓은 거실에는 고급 가구와 대형 TV가 있습니다. 사건 당일 밤 가족들이 모여 있던 장소입니다.',
      clues: ['clue-004']
    },
    {
      id: 'location-003',
      name: '주방',
      description: '현대적인 주방 시설이 갖춰져 있습니다. 사건 당일 저녁 식사가 준비된 장소입니다.',
      clues: ['clue-005']
    },
    {
      id: 'location-004',
      name: '정원',
      description: '넓은 정원에는 다양한 식물과 분수대가 있습니다. 사건 당일 밤 누군가 정원을 통해 들어온 흔적이 있습니다.',
      clues: ['clue-006']
    },
    {
      id: 'location-005',
      name: '김재원의 침실',
      description: '김재원의 개인 침실. 킹사이즈 침대와 드레싱 룸이 있습니다.',
      clues: ['clue-007', 'clue-008']
    }
  ],
  
  clues: [
    {
      id: 'clue-001',
      title: '살인 무기',
      description: '무거운 금속 문진. 피해자의 혈흔과 지문이 묻어 있습니다.',
      relatedTo: ['character-002'],
      isRevealed: false
    },
    {
      id: 'clue-002',
      title: '찢어진 문서',
      description: '서재 쓰레기통에서 발견된 찢어진 문서 조각. 회사 자금 횡령에 관한 내용이 담겨 있습니다.',
      relatedTo: ['character-001', 'character-002'],
      isRevealed: false
    },
    {
      id: 'clue-003',
      title: '서재 책상 위의 노트',
      description: '김재원이 마지막으로 작성한 노트. "이지현과 만남 - 중요한 논의"라고 적혀 있습니다.',
      relatedTo: ['character-001', 'character-002'],
      isRevealed: false
    },
    {
      id: 'clue-004',
      title: '깨진 유리잔',
      description: '거실 바닥에 떨어진 깨진 유리잔. 와인 자국이 남아 있습니다.',
      relatedTo: ['character-003'],
      isRevealed: false
    },
    {
      id: 'clue-005',
      title: '주방 칼 세트',
      description: '주방 칼 세트 중 하나가 없어졌습니다. 하지만 살인 무기로 사용되지는 않았습니다.',
      relatedTo: ['character-003'],
      isRevealed: false
    },
    {
      id: 'clue-006',
      title: '정원의 발자국',
      description: '정원에서 발견된 발자국. 사이즈는 작은 여성용 신발로 추정됩니다.',
      relatedTo: ['character-002'],
      isRevealed: false
    },
    {
      id: 'clue-007',
      title: '김재원의 일기',
      description: '침실 서랍에서 발견된 일기. 최근 이지현이 회사 자금 횡령을 발견했다는 내용이 적혀 있습니다.',
      relatedTo: ['character-001', 'character-002'],
      isRevealed: false
    },
    {
      id: 'clue-008',
      title: '이혼 서류',
      description: '침실 금고에서 발견된 이혼 서류. 아직 서명되지 않았습니다.',
      relatedTo: ['character-001', 'character-003'],
      isRevealed: false
    }
  ]
}; 