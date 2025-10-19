```text
chat-app/
├─ backend/
│  ├─ src/main/java/com/example/chatapp/
│  │  ├─ ChatAppApplication.java
│  │  ├─ config/
│  │  │  ├─ WebSocketConfig.java
│  │  │  ├─ SecurityConfig.java
│  │  │  ├─ JwtAuthFilter.java
│  │  │  └─ MongoConfig.java
│  │  ├─ security/
│  │  │  ├─ JwtUtil.java
│  │  │  └─ CustomUserDetailsService.java
│  │  ├─ domain/
│  │  │  ├─ User.java
│  │  │  ├─ Room.java
│  │  │  ├─ RoomPermission.java
│  │  │  ├─ Membership.java
│  │  │  ├─ Message.java
│  │  │  └─ Review.java
│  │  ├─ dto/
│  │  │  ├─ AuthDtos.java
│  │  │  ├─ RoomDtos.java
│  │  │  ├─ MessageDtos.java
│  │  │  └─ ReviewDtos.java
│  │  ├─ repo/
│  │  │  ├─ UserRepo.java
│  │  │  ├─ RoomRepo.java
│  │  │  ├─ MembershipRepo.java
│  │  │  ├─ MessageRepo.java
│  │  │  └─ ReviewRepo.java
│  │  ├─ service/
│  │  │  ├─ AuthService.java
│  │  │  ├─ RoomService.java
│  │  │  ├─ MessageService.java
│  │  │  └─ ReviewService.java
│  │  ├─ ws/
│  │  │  ├─ PresenceService.java
│  │  │  └─ ChatControllerWS.java
│  │  └─ web/
│  │     ├─ AuthController.java
│  │     ├─ RoomController.java
│  │     ├─ UserController.java
│  │     ├─ MessageController.java
│  │     └─ ReviewController.java
│  ├─ src/main/resources/
│  │  ├─ application.yml
│  │  └─ banner.txt
│  └─ pom.xml
│
├─ frontend/
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ package.json
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  ├─ .env
│  └─ src/
│     ├─ main.tsx
│     ├─ api/http.ts
│     ├─ store/auth.ts
│     ├─ App.tsx
│     ├─ styles/glass.css
│     ├─ components/
│     │  ├─ GlassCard.tsx
│     │  ├─ TopNav.tsx
│     │  ├─ RoomList.tsx
│     │  ├─ ChatWindow.tsx
│     │  ├─ MembersPanel.tsx
│     │  └─ ReviewsPanel.tsx
│     └─ pages/
│        ├─ Login.tsx
│        └─ Dashboard.tsx
│
└─ docker-compose.yml
```