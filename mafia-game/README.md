# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).


## 마피아 게임 소개

이 마피아 게임은 다음과 같은 기능을 포함하고 있습니다:

- **로그인 페이지**: 사용자 이름을 입력하여 게임에 참여할 수 있습니다.
- **로비 페이지**: 게임방을 생성하거나 기존 게임방에 참여할 수 있습니다.
- **게임방 페이지**: 게임 시작 전 대기실로, 참가자 목록과 채팅 기능을 제공합니다.
- **게임 페이지**: 실제 게임이 진행되는 페이지로, 역할에 따른 행동, 투표, 채팅 등의 기능을 제공합니다.

## 게임 역할

이 게임은 다음과 같은 역할을 포함하고 있습니다:

- **시민**: 낮에 토론을 통해 마피아를 찾아내는 역할입니다.
- **마피아**: 밤에 시민을 죽이고 낮에는 정체를 숨기는 역할입니다.
- **의사**: 밤에 한 명을 선택하여 마피아의 공격으로부터 보호할 수 있는 역할입니다.
- **경찰**: 밤에 한 명을 조사하여 마피아인지 확인할 수 있는 역할입니다.

## AI 플레이어 기능

이 게임은 인공지능(AI) 플레이어 기능을 제공합니다:

- **AI 플레이어 추가**: 게임방에서 호스트는 AI 플레이어를 추가할 수 있습니다.
- **난이도 설정**: AI 플레이어의 난이도를 쉬움, 보통, 어려움 중에서 선택할 수 있습니다.
- **AI 행동 시스템**: 
  - AI 플레이어는 게임 상황에 맞게 채팅을 합니다.
  - 밤에는 역할에 따라 적절한 대상을 선택합니다.
  - 투표 시간에는 게임 상황을 분석하여 투표합니다.
- **난이도별 특징**:
  - **쉬움**: 랜덤하게 행동하며 전략이 거의 없습니다.
  - **보통**: 기본적인 전략을 사용하여 행동합니다.
  - **어려움**: 고급 전략을 사용하여 투표 패턴과 채팅을 분석하고 행동합니다.

AI 플레이어는 인간 플레이어가 부족할 때 게임을 즐길 수 있도록 도와주며, 다양한 난이도로 게임의 재미를 더합니다.

## 확장 가능성

이 게임은 다음과 같이 확장할 수 있습니다:

- **실시간 멀티플레이어**: Socket.io를 사용하여 실시간 멀티플레이어 기능을 구현할 수 있습니다.
- **추가 역할**: 군인, 기자, 마담 등 다양한 역할을 추가하여 게임의 재미를 높일 수 있습니다.
- **게임 설정**: 게임 시작 전 역할 분배, 타이머 시간 등을 설정할 수 있는 기능을 추가할 수 있습니다.
- **게임 로그**: 게임 진행 상황을 기록하고 게임 종료 후 확인할 수 있는 기능을 추가할 수 있습니다.
- **그래픽 개선**: 캐릭터 일러스트, 애니메이션 등을 추가하여 시각적 경험을 향상시킬 수 있습니다.
- **AI 개선**: 더 복잡한 AI 알고리즘을 적용하여 더 지능적인 AI 플레이어를 구현할 수 있습니다.