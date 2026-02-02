import { ServerWebSocket } from 'bun';
import { nodeService } from '../services/nodeService';

interface AgentWebSocketData {
  id: string;
}

export function setupAgentWebSocket(server: any) {
  const agents = new Map<string, ServerWebSocket<AgentWebSocketData>>();

  return {
    open(ws: ServerWebSocket<AgentWebSocketData>) {
      console.log('🦀 Agent connected:', ws.data.id);
      agents.set(ws.data.id, ws);
    },

    message(ws: ServerWebSocket<AgentWebSocketData>, message: string | Buffer) {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.event === 'node:register') {
          const nodeData = data.data;
          console.log('📝 Agent registered:', nodeData.name);
          
          // Add or update node in service
          nodeService.addOrUpdateNode(nodeData);
          
          // Acknowledge registration
          ws.send(JSON.stringify({
            event: 'register:success',
            data: { id: nodeData.id, timestamp: new Date().toISOString() }
          }));
        }
        
        if (data.event === 'node:metrics') {
          const nodeData = data.data;
          // Update node metrics
          nodeService.addOrUpdateNode(nodeData);
        }
      } catch (error) {
        console.error('Error processing agent message:', error);
      }
    },

    close(ws: ServerWebSocket<AgentWebSocketData>) {
      console.log('🔌 Agent disconnected:', ws.data.id);
      agents.delete(ws.data.id);
      
      // Mark node as offline
      nodeService.markNodeOffline(ws.data.id);
    },

    error(ws: ServerWebSocket<AgentWebSocketData>, error: Error) {
      console.error('Agent WebSocket error:', error);
    }
  };
}
