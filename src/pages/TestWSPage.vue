<template>
  <q-page class="flex flex-center">
    <div class="column items-center">
      <div class="text-h6 q-mb-md">房間: {{ floor }}-{{ zone }} (UID: {{ userId }})</div>
      
      <div 
        class="relative-position bg-grey-3 shadow-2" 
        style="width: 600px; height: 400px; overflow: hidden; border: 1px solid #ccc;"
        @click="sendMove"
      >
        <div
          v-for="(pos, uid) in otherUsers"
          :key="uid"
          class="absolute shadow-1"
          :style="{
            left: pos.x + 'px',
            top: pos.y + 'px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'red',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.2s'
          }"
        >
          <q-tooltip>{{ uid }}</q-tooltip>
        </div>

        <div
          class="absolute shadow-3"
          :style="{
            left: myPos.x + 'px',
            top: myPos.y + 'px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: 'blue',
            border: '2px solid white',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const floor = (route.query.floor as string) || '1';
const zone = (route.query.zone as string) || 'A';

// 🆕 改進 1: UserID 持久化，重新整理不會變 ID，減少 Redis 幽靈點
const getUserId = () => {
  const saved = localStorage.getItem('lib_uid');
  if (saved) return saved;
  const newId = `user_${Math.floor(Math.random() * 1000)}`;
  localStorage.setItem('lib_uid', newId);
  return newId;
};
const userId = ref(getUserId());

const myPos = ref({ x: 0, y: 0 });
const otherUsers = ref<Record<string, { x: number; y: number }>>({});

let socket: WebSocket | null = null;

// 🆕 改進 2: 封裝連線邏輯，方便 Debug
const initWebSocket = () => {
  if (socket) {
    console.log('🔌 關閉舊連線...');
    socket.close();
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // 💡 注意：如果你是用手機測，記得把 localhost 換成你電腦的 IP
  const url = `${protocol}//localhost:8080/api/v1/library/ws?floor=${floor}&zone=${zone}&userId=${userId.value}`;
  
  console.log('🚀 正在連線到:', url);
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('✅ 連線成功！發送 JOIN...');
    socket?.send(JSON.stringify({
      type: 'JOIN',
      userId: userId.value,
      payload: { x: myPos.value.x, y: myPos.value.y }
    }));
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log('📩 收到訊息:', msg); // 👈 這裡有沒有印，決定了後端有沒有吐資料

    if (msg.type === 'MOVE') {
      if (msg.userId !== userId.value) {
        otherUsers.value[msg.userId] = msg.payload;
      }
    } else if (msg.type === 'SYNC_ALL') {
      const remoteData = msg.data || {};
      const newOthers: Record<string, any> = {};
      Object.keys(remoteData).forEach((uid) => {
        if (uid !== userId.value) {
          try {
            // Redis 回傳的 Hash Value 通常是 String，要多 parse 一次
            newOthers[uid] = typeof remoteData[uid] === 'string' 
              ? JSON.parse(remoteData[uid]) 
              : remoteData[uid];
          } catch (e) {
            newOthers[uid] = remoteData[uid];
          }
        }
      });
      otherUsers.value = newOthers;
    } else if (msg.type === 'LEAVE') {
      delete otherUsers.value[msg.userId];
    }
  };

  socket.onclose = () => console.log('🔌 連線已斷開');
  socket.onerror = (err) => console.error('❌ WS 錯誤:', err);
};

onMounted(() => {
  initWebSocket();
});

onUnmounted(() => {
  socket?.close();
});

const sendMove = (e: MouseEvent) => {
  const x = e.offsetX;
  const y = e.offsetY;
  myPos.value = { x, y };

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'MOVE',
      userId: userId.value,
      payload: { x, y }
    }));
  }
};
</script>