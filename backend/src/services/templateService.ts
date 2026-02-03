import { logger } from '../utils/logger';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'game' | 'hosting' | 'platform' | 'database' | 'compute';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  requirements: {
    cpu: number;
    memory: number;
    disk: number;
    ports: number[];
  };
  estimatedCost: {
    monthly: number;
    hourly: number;
  };
  components: Array<{
    name: string;
    type: string;
    config: Record<string, any>;
  }>;
  features: string[];
  documentation: string;
}

class TemplateService {
  private templates: Map<string, Template> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Game Server Templates
    this.addTemplate({
      id: 'minecraft',
      name: 'Minecraft Server',
      description: 'Java and Bedrock edition Minecraft server with auto-backup',
      category: 'game',
      difficulty: 'beginner',
      icon: '🎮',
      requirements: { cpu: 2, memory: 4, disk: 25, ports: [25565, 19132] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'minecraft-java', type: 'container', config: { image: 'itzg/minecraft-server', env: { EULA: 'TRUE' } } },
        { name: 'minecraft-bedrock', type: 'container', config: { image: 'itzg/minecraft-bedrock-server' } }
      ],
      features: ['Auto-backup', 'Plugin support', 'Whitelist management', 'Performance monitoring'],
      documentation: 'Complete Minecraft server with both Java and Bedrock editions'
    });

    this.addTemplate({
      id: 'csgo',
      name: 'Counter-Strike: GO Server',
      description: 'Dedicated CS:GO server with competitive settings',
      category: 'game',
      difficulty: 'intermediate',
      icon: '🔫',
      requirements: { cpu: 4, memory: 4, disk: 30, ports: [27015] },
      estimatedCost: { monthly: 80, hourly: 0.111 },
      components: [
        { name: 'csgo-server', type: 'steamcmd', config: { appid: 740, server_cfg: 'competitive' } }
      ],
      features: ['Competitive mode', 'Custom maps', 'GOTV', 'SourceMod support'],
      documentation: 'Production-ready CS:GO dedicated server'
    });

    this.addTemplate({
      id: 'valheim',
      name: 'Valheim Dedicated Server',
      description: 'Valheim survival game server with world management',
      category: 'game',
      difficulty: 'beginner',
      icon: '⚔️',
      requirements: { cpu: 2, memory: 4, disk: 20, ports: [2456, 2457, 2458] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'valheim-server', type: 'container', config: { image: 'lloesche/valheim-server' } }
      ],
      features: ['World backup', 'BepInEx mod support', 'Auto-updates', 'Performance optimized'],
      documentation: 'Valheim dedicated server with mod support'
    });

    this.addTemplate({
      id: 'ark',
      name: 'ARK: Survival Evolved Server',
      description: 'High-performance ARK server with mod support',
      category: 'game',
      difficulty: 'advanced',
      icon: '🦖',
      requirements: { cpu: 4, memory: 8, disk: 100, ports: [7777, 7778, 27015] },
      estimatedCost: { monthly: 150, hourly: 0.208 },
      components: [
        { name: 'ark-server', type: 'steamcmd', config: { appid: 376030, mods: [] } }
      ],
      features: ['Cluster support', 'Mod support', 'Auto-backup', 'RCON management'],
      documentation: 'Production ARK server with clustering support'
    });

    this.addTemplate({
      id: 'rust',
      name: 'Rust Server',
      description: 'Rust survival game server with oxide mod support',
      category: 'game',
      difficulty: 'advanced',
      icon: '🔥',
      requirements: { cpu: 4, memory: 8, disk: 50, ports: [28015, 28016] },
      estimatedCost: { monthly: 150, hourly: 0.208 },
      components: [
        { name: 'rust-server', type: 'steamcmd', config: { appid: 258550, oxide: true } }
      ],
      features: ['Oxide plugin support', 'Auto-wipe', 'RCON', 'Performance monitoring'],
      documentation: 'High-performance Rust server with Oxide'
    });

    this.addTemplate({
      id: 'tf2',
      name: 'Team Fortress 2 Server',
      description: 'TF2 dedicated server with SourceMod',
      category: 'game',
      difficulty: 'intermediate',
      icon: '🎩',
      requirements: { cpu: 2, memory: 4, disk: 25, ports: [27015] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'tf2-server', type: 'steamcmd', config: { appid: 232250, sourcemod: true } }
      ],
      features: ['SourceMod', 'Custom maps', 'Fast download', 'Admin controls'],
      documentation: 'TF2 server with SourceMod and MetaMod'
    });

    this.addTemplate({
      id: 'terraria',
      name: 'Terraria Server',
      description: 'Lightweight Terraria multiplayer server',
      category: 'game',
      difficulty: 'beginner',
      icon: '⛏️',
      requirements: { cpu: 2, memory: 2, disk: 10, ports: [7777] },
      estimatedCost: { monthly: 40, hourly: 0.056 },
      components: [
        { name: 'terraria-server', type: 'container', config: { image: 'ryshe/terraria' } }
      ],
      features: ['World management', 'Auto-backup', 'Low resource usage', 'Easy setup'],
      documentation: 'Simple Terraria server for multiplayer'
    });

    this.addTemplate({
      id: '7dtd',
      name: '7 Days to Die Server',
      description: 'Dedicated 7 Days to Die survival server',
      category: 'game',
      difficulty: 'intermediate',
      icon: '🧟',
      requirements: { cpu: 4, memory: 6, disk: 40, ports: [26900, 26901, 26902] },
      estimatedCost: { monthly: 120, hourly: 0.167 },
      components: [
        { name: '7dtd-server', type: 'steamcmd', config: { appid: 294420 } }
      ],
      features: ['Admin tools', 'Mod support', 'Auto-backup', 'Web panel'],
      documentation: '7 Days to Die dedicated server'
    });

    this.addTemplate({
      id: 'factorio',
      name: 'Factorio Server',
      description: 'Factorio multiplayer factory building server',
      category: 'game',
      difficulty: 'beginner',
      icon: '🏭',
      requirements: { cpu: 2, memory: 4, disk: 20, ports: [34197] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'factorio-server', type: 'container', config: { image: 'factoriotools/factorio' } }
      ],
      features: ['Save management', 'Mod support', 'Auto-pause', 'RCON'],
      documentation: 'Factorio dedicated server with mod support'
    });

    this.addTemplate({
      id: 'generic-game',
      name: 'Generic Game Server',
      description: 'Customizable template for any game server',
      category: 'game',
      difficulty: 'advanced',
      icon: '🎯',
      requirements: { cpu: 2, memory: 4, disk: 20, ports: [] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'game-server', type: 'custom', config: {} }
      ],
      features: ['Fully customizable', 'SteamCMD support', 'Docker support', 'Script automation'],
      documentation: 'Generic template for custom game servers'
    });

    // Web Hosting Templates
    this.addTemplate({
      id: 'static-website',
      name: 'Static Website',
      description: 'High-performance static website with Nginx',
      category: 'hosting',
      difficulty: 'beginner',
      icon: '🌐',
      requirements: { cpu: 1, memory: 1, disk: 10, ports: [80, 443] },
      estimatedCost: { monthly: 20, hourly: 0.028 },
      components: [
        { name: 'nginx', type: 'container', config: { image: 'nginx:alpine', volumes: ['/data/www:/usr/share/nginx/html'] } }
      ],
      features: ['SSL/TLS support', 'CDN ready', 'Gzip compression', 'Fast delivery'],
      documentation: 'Static website hosting with Nginx'
    });

    this.addTemplate({
      id: 'nodejs-express',
      name: 'Node.js + Express',
      description: 'Dynamic Node.js web application with Express framework',
      category: 'hosting',
      difficulty: 'intermediate',
      icon: '🟢',
      requirements: { cpu: 2, memory: 2, disk: 20, ports: [3000] },
      estimatedCost: { monthly: 40, hourly: 0.056 },
      components: [
        { name: 'nodejs', type: 'container', config: { image: 'node:18-alpine', pm2: true } }
      ],
      features: ['PM2 process manager', 'Auto-restart', 'Log management', 'Environment config'],
      documentation: 'Node.js application with Express'
    });

    this.addTemplate({
      id: 'php-website',
      name: 'PHP Website',
      description: 'PHP website with Apache and MySQL',
      category: 'hosting',
      difficulty: 'intermediate',
      icon: '🐘',
      requirements: { cpu: 2, memory: 4, disk: 30, ports: [80, 443] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'apache-php', type: 'container', config: { image: 'php:8.2-apache' } },
        { name: 'mysql', type: 'container', config: { image: 'mysql:8.0' } }
      ],
      features: ['PHP 8.2', 'MySQL 8.0', 'phpMyAdmin', 'SSL support'],
      documentation: 'PHP website with Apache and MySQL'
    });

    this.addTemplate({
      id: 'python-webapp',
      name: 'Python Web App',
      description: 'Python web application with Django or Flask',
      category: 'hosting',
      difficulty: 'intermediate',
      icon: '🐍',
      requirements: { cpu: 2, memory: 4, disk: 25, ports: [8000] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'python-app', type: 'container', config: { image: 'python:3.11', gunicorn: true } }
      ],
      features: ['Django/Flask support', 'Gunicorn WSGI', 'PostgreSQL ready', 'Static files serving'],
      documentation: 'Python web application hosting'
    });

    this.addTemplate({
      id: 'ruby-rails',
      name: 'Ruby on Rails',
      description: 'Ruby on Rails application with PostgreSQL',
      category: 'hosting',
      difficulty: 'intermediate',
      icon: '💎',
      requirements: { cpu: 2, memory: 4, disk: 30, ports: [3000] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'rails-app', type: 'container', config: { image: 'ruby:3.2', puma: true } },
        { name: 'postgresql', type: 'container', config: { image: 'postgres:15' } }
      ],
      features: ['Rails 7+', 'Puma server', 'PostgreSQL', 'Asset pipeline'],
      documentation: 'Ruby on Rails application hosting'
    });

    this.addTemplate({
      id: 'ghost-blog',
      name: 'Ghost Blog',
      description: 'Modern Ghost blogging platform',
      category: 'hosting',
      difficulty: 'beginner',
      icon: '👻',
      requirements: { cpu: 1, memory: 2, disk: 20, ports: [2368] },
      estimatedCost: { monthly: 40, hourly: 0.056 },
      components: [
        { name: 'ghost', type: 'container', config: { image: 'ghost:5-alpine' } }
      ],
      features: ['Modern editor', 'SEO optimized', 'Themes', 'Newsletter support'],
      documentation: 'Ghost blogging platform'
    });

    this.addTemplate({
      id: 'portfolio-site',
      name: 'Portfolio Site',
      description: 'Professional portfolio website',
      category: 'hosting',
      difficulty: 'beginner',
      icon: '💼',
      requirements: { cpu: 1, memory: 1, disk: 10, ports: [80, 443] },
      estimatedCost: { monthly: 20, hourly: 0.028 },
      components: [
        { name: 'portfolio', type: 'container', config: { image: 'nginx:alpine' } }
      ],
      features: ['Responsive design', 'Fast loading', 'SEO ready', 'SSL included'],
      documentation: 'Professional portfolio website'
    });

    this.addTemplate({
      id: 'landing-page',
      name: 'Landing Page',
      description: 'High-converting landing page',
      category: 'hosting',
      difficulty: 'beginner',
      icon: '🚀',
      requirements: { cpu: 1, memory: 0.5, disk: 5, ports: [80, 443] },
      estimatedCost: { monthly: 10, hourly: 0.014 },
      components: [
        { name: 'landing', type: 'container', config: { image: 'nginx:alpine' } }
      ],
      features: ['Lightning fast', 'Mobile optimized', 'Analytics ready', 'A/B testing support'],
      documentation: 'High-converting landing page'
    });

    // Web Game & Platform Templates
    this.addTemplate({
      id: 'html5-game',
      name: 'HTML5 Game Server',
      description: 'Server for HTML5 browser games',
      category: 'platform',
      difficulty: 'intermediate',
      icon: '🎮',
      requirements: { cpu: 2, memory: 4, disk: 30, ports: [8080] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'game-server', type: 'container', config: { image: 'node:18-alpine', websocket: true } }
      ],
      features: ['WebSocket support', 'Asset caching', 'CDN integration', 'Real-time sync'],
      documentation: 'HTML5 game hosting with WebSocket'
    });

    this.addTemplate({
      id: 'multiplayer-backend',
      name: 'Multiplayer Game Backend',
      description: 'Scalable backend for multiplayer games',
      category: 'platform',
      difficulty: 'advanced',
      icon: '🎯',
      requirements: { cpu: 4, memory: 8, disk: 40, ports: [8080, 9090] },
      estimatedCost: { monthly: 150, hourly: 0.208 },
      components: [
        { name: 'game-backend', type: 'container', config: { image: 'node:18', colyseus: true } },
        { name: 'redis', type: 'container', config: { image: 'redis:7-alpine' } }
      ],
      features: ['Real-time networking', 'State synchronization', 'Matchmaking', 'Leaderboards'],
      documentation: 'Multiplayer game backend with Colyseus'
    });

    this.addTemplate({
      id: 'game-lobby',
      name: 'Game Lobby Server',
      description: 'Matchmaking and lobby system',
      category: 'platform',
      difficulty: 'intermediate',
      icon: '🎪',
      requirements: { cpu: 2, memory: 4, disk: 20, ports: [8080] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'lobby-server', type: 'container', config: { image: 'node:18-alpine' } }
      ],
      features: ['Player matchmaking', 'Room management', 'Party system', 'Chat integration'],
      documentation: 'Game lobby and matchmaking server'
    });

    this.addTemplate({
      id: 'leaderboard-service',
      name: 'Leaderboard Service',
      description: 'High-performance leaderboard system',
      category: 'platform',
      difficulty: 'intermediate',
      icon: '🏆',
      requirements: { cpu: 2, memory: 2, disk: 10, ports: [8080] },
      estimatedCost: { monthly: 40, hourly: 0.056 },
      components: [
        { name: 'leaderboard', type: 'container', config: { image: 'node:18-alpine' } },
        { name: 'redis', type: 'container', config: { image: 'redis:7-alpine' } }
      ],
      features: ['Real-time ranking', 'Multiple leaderboards', 'Time-based resets', 'API access'],
      documentation: 'High-performance leaderboard service'
    });

    this.addTemplate({
      id: 'gaming-platform',
      name: 'Gaming Platform',
      description: 'Complete gaming platform like Steam',
      category: 'platform',
      difficulty: 'advanced',
      icon: '🎮',
      requirements: { cpu: 8, memory: 16, disk: 200, ports: [8080, 8443] },
      estimatedCost: { monthly: 350, hourly: 0.486 },
      components: [
        { name: 'platform-api', type: 'container', config: { image: 'node:18' } },
        { name: 'postgresql', type: 'container', config: { image: 'postgres:15' } },
        { name: 'redis', type: 'container', config: { image: 'redis:7' } },
        { name: 'frontend', type: 'container', config: { image: 'nginx:alpine' } }
      ],
      features: ['Store front', 'Game launcher', 'Social features', 'Achievement system', 'Cloud saves'],
      documentation: 'Complete gaming platform'
    });

    this.addTemplate({
      id: 'game-cdn',
      name: 'Game Asset CDN',
      description: 'CDN for game assets and updates',
      category: 'platform',
      difficulty: 'advanced',
      icon: '📦',
      requirements: { cpu: 4, memory: 8, disk: 500, ports: [80, 443] },
      estimatedCost: { monthly: 200, hourly: 0.278 },
      components: [
        { name: 'cdn', type: 'container', config: { image: 'nginx:alpine', cache: true } }
      ],
      features: ['Global distribution', 'Asset caching', 'Delta updates', 'Bandwidth optimization'],
      documentation: 'Game asset CDN for fast distribution'
    });

    this.addTemplate({
      id: 'game-auth',
      name: 'Game Authentication Server',
      description: 'Authentication and user management for games',
      category: 'platform',
      difficulty: 'intermediate',
      icon: '🔐',
      requirements: { cpu: 2, memory: 4, disk: 20, ports: [8080] },
      estimatedCost: { monthly: 60, hourly: 0.083 },
      components: [
        { name: 'auth-server', type: 'container', config: { image: 'node:18', oauth: true } },
        { name: 'postgresql', type: 'container', config: { image: 'postgres:15' } }
      ],
      features: ['OAuth 2.0', 'JWT tokens', 'SSO support', '2FA', 'Session management'],
      documentation: 'Game authentication and user management'
    });

    logger.info(`Initialized ${this.templates.size} templates`);
  }

  private addTemplate(template: Template) {
    this.templates.set(template.id, template);
  }

  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): Template[] {
    if (category === 'all') {
      return this.getAllTemplates();
    }
    return this.getAllTemplates().filter(t => t.category === category);
  }

  getTemplateById(id: string): Template | undefined {
    return this.templates.get(id);
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    this.templates.forEach(t => categories.add(t.category));
    return Array.from(categories);
  }

  async deployTemplate(templateId: string, config: any): Promise<{ success: boolean; message: string; deploymentId?: string }> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { success: false, message: 'Template not found' };
    }

    logger.info(`Deploying template: ${template.name}`);

    // Simulate deployment
    const deploymentId = `deploy-${Date.now()}`;

    // In a real implementation, this would:
    // 1. Validate requirements
    // 2. Allocate resources
    // 3. Deploy components
    // 4. Configure networking
    // 5. Start services
    // 6. Health check

    return {
      success: true,
      message: `Template ${template.name} deployed successfully`,
      deploymentId
    };
  }
}

export const templateService = new TemplateService();
