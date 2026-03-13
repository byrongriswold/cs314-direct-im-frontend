# DirectIM Frontend

The frontend for an instant messaging application built with React and Vite. It connects to a backend API provided by the course TA. The application supports authentication, chat room management, real-time messaging, and profile management. The project includes unit and feature tests implemented with Jest and React Testing Library.

## Prerequisites
- Node.js (LTS version recommended)
- npm (included with Node.js)
- Access to the backend API endpoint used by this frontend

## Project Structure

frontend/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── lib/
│   │   ├── apiClient.js
│   │   ├── constants.js
│   │   └── socket.js
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Auth.jsx
│   │   └── chat/
│   │       ├── Chat.jsx
│   │       ├── ChatList.jsx
│   │       ├── ChatRoom.jsx
│   │       ├── NewChat.jsx
│   │       └── Profile.jsx
│   ├── App.jsx
│   ├── main.jsx
│   ├── App.css
│   └── index.css
├── __tests__/
│   ├── unit/
│   │   ├── Auth.unit.test.jsx
│   │   ├── Chat.unit.test.jsx
│   │   ├── ChatList.unit.test.jsx
│   │   ├── ChatRoom.unit.test.jsx
│   │   ├── NewChat.unit.test.jsx
│   │   └── Profile.unit.test.jsx
│   └── feature/
│       ├── Auth.test.jsx
│       ├── ChatRoomManagement.test.jsx
│       ├── MessagingAndHistory.test.jsx
│       └── ProfileAndLogout.test.jsx
├── __mocks__/
│   ├── api-client.js
│   └── constants.js
├── coverage/
├── public/
│   └── vite.svg
├── .env
├── babel.config.cjs
├── eslint.config.js
├── index.html
├── jest.config.cjs
├── jest.setup.js
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md

## Installation
1. Clone the repository
2. Navigate to the project directory in your terminal:

```bash
cd cs314-direct-im-frontend
```

3. Install dependencies:

```bash
npm install
```

## Usage
1. Start the development server:

```bash
npm run dev
```

2. Open the app in your browser using the local address shown by Vite (typically `http://localhost:5173/`)

## Environment Variables
This repository already includes a .env file configured with: 
`VITE_SERVER_URL=https://pretorial-portliest-vertie.ngrok-free.dev`
