import { WebSocketServer, WebSocket } from 'ws';
import { nodeService } from '../services/nodeService';

const PING_INTERVAL_MS = 15000;
const PONG_TIMEOUT_MS = 30000;

export function setupAgentWebSocket(wss: WebSocketServer) {
  const agents = new Map<string, { socket: WebSocket; pongTimer?: NodeJS.Timeout; pingTimer?: NodeJS.Timeout }>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const agentId = url.searchParams.get('id') || `agent-${Date.now()}`;

    console.log('🦀 Agent connected:', agentId);
    agents.set(agentId, { socket: ws });

    const startPing = () => {
      const pingTimer = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;

        // Only ping if no data in flight to reduce false timeouts
        ws.ping();

        const pongTimer = setTimeout(() => {
          console.warn(`⚠️ Agent ${agentId} missed pong, terminating`);
          ws.terminate();
        }, PONG_TIMEOUT_MS);

        const record = agents.get(agentId);
        if (record) {
          if (record.pongTimer) clearTimeout(record.pongTimer);
          record.pongTimer = pongTimer;
          record.pingTimer = pingTimer;
          agents.set(agentId, record);
        }
      }, PING_INTERVAL_MS);
    };

    ws.on('pong', () => {
      const record = agents.get(agentId);
      if (record?.pongTimer) {
        clearTimeout(record.pongTimer);
        record.pongTimer = undefined;
        agents.set(agentId, record);
      }
    });

    ws.on('message', (message: WebSocket.RawData) => {
      // Reset pong timer on any traffic
      const record = agents.get(agentId);
      if (record?.pongTimer) {
        clearTimeout(record.pongTimer);
        record.pongTimer = undefined;
        agents.set(agentId, record);
      }

      try {
        const data = JSON.parse(message.toString());

        if (data.event === 'node:register') {
          const nodeData = data.data;
          console.log('📝 Agent registered:', nodeData.name);

          nodeService.addOrUpdateNode(nodeData);

          ws.send(JSON.stringify({
            event: 'register:success',
            data: { id: nodeData.id, timestamp: new Date().toISOString() }
          }));
        }

        if (data.event === 'node:metrics') {
          const nodeData = data.data;
          nodeService.addOrUpdateNode(nodeData);
        }
      } catch (error) {
        console.error('Error processing agent message:', error);
      }
    });

    ws.on('close', () => {
      console.log('🔌 Agent disconnected:', agentId);
      const record = agents.get(agentId);
      if (record?.pingTimer) clearInterval(record.pingTimer);
      if (record?.pongTimer) clearTimeout(record.pongTimer);
      agents.delete(agentId);
      nodeService.markNodeOffline(agentId);
    });

    ws.on('error', (error) => {
      console.error('Agent WebSocket error:', error);
    });

    startPing();
  });
}
