import { Pool } from 'pg';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

interface PipelineConfig {
  id: string;
  name: string;
  repository: string;
  branch: string;
  trigger: 'push' | 'pull_request' | 'manual' | 'schedule';
  stages: PipelineStage[];
  environment: Record<string, string>;
}

interface PipelineStage {
  name: string;
  jobs: PipelineJob[];
  condition?: string;
}

interface PipelineJob {
  name: string;
  commands: string[];
  environment?: Record<string, string>;
  artifacts?: string[];
}

interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'canceled';
  startedAt: Date;
  completedAt?: Date;
  logs: string[];
  artifacts: string[];
}

export class CICDAutomationService {
  private db: Pool;
  private redis: Redis;
  private pipelines: Map<string, PipelineConfig>;
  private activeRuns: Map<string, PipelineRun>;

  constructor(db: Pool, redis: Redis) {
    this.db = db;
    this.redis = redis;
    this.pipelines = new Map();
    this.activeRuns = new Map();
  }

  async createPipeline(config: Omit<PipelineConfig, 'id'>): Promise<PipelineConfig> {
    try {
      const id = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pipeline: PipelineConfig = { id, ...config };

      await this.db.query(
        `INSERT INTO ci_pipelines (id, name, repository, branch, trigger, stages, environment)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          pipeline.id,
          pipeline.name,
          pipeline.repository,
          pipeline.branch,
          pipeline.trigger,
          JSON.stringify(pipeline.stages),
          JSON.stringify(pipeline.environment)
        ]
      );

      this.pipelines.set(id, pipeline);
      logger.info(`Pipeline created: ${pipeline.name}`);

      return pipeline;
    } catch (error) {
      logger.error('Failed to create pipeline:', error);
      throw error;
    }
  }

  async triggerPipeline(pipelineId: string, trigger: any = {}): Promise<PipelineRun> {
    try {
      const pipeline = this.pipelines.get(pipelineId);
      if (!pipeline) {
        throw new Error(`Pipeline not found: ${pipelineId}`);
      }

      const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pipelineRun: PipelineRun = {
        id: runId,
        pipelineId,
        status: 'pending',
        startedAt: new Date(),
        logs: [],
        artifacts: []
      };

      await this.db.query(
        `INSERT INTO ci_pipeline_runs (id, pipeline_id, status, started_at, trigger_data)
         VALUES ($1, $2, $3, $4, $5)`,
        [runId, pipelineId, 'pending', pipelineRun.startedAt, JSON.stringify(trigger)]
      );

      this.activeRuns.set(runId, pipelineRun);
      
      // Start pipeline execution asynchronously
      this.executePipeline(runId, pipeline).catch(error => {
        logger.error(`Pipeline execution failed: ${runId}`, error);
      });

      logger.info(`Pipeline triggered: ${pipeline.name} (run: ${runId})`);
      return pipelineRun;
    } catch (error) {
      logger.error('Failed to trigger pipeline:', error);
      throw error;
    }
  }

  private async executePipeline(runId: string, pipeline: PipelineConfig): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) return;

    try {
      run.status = 'running';
      await this.updatePipelineRun(run);

      for (const stage of pipeline.stages) {
        logger.info(`Executing stage: ${stage.name}`);
        run.logs.push(`[Stage] ${stage.name}`);

        // Check stage condition
        if (stage.condition && !this.evaluateCondition(stage.condition)) {
          run.logs.push(`[Skipped] Condition not met: ${stage.condition}`);
          continue;
        }

        for (const job of stage.jobs) {
          logger.info(`Executing job: ${job.name}`);
          run.logs.push(`[Job] ${job.name}`);

          try {
            await this.executeJob(job, run);
          } catch (error) {
            run.status = 'failed';
            run.logs.push(`[Error] Job failed: ${(error as Error).message}`);
            throw error;
          }
        }
      }

      run.status = 'success';
      run.completedAt = new Date();
      run.logs.push('[Complete] Pipeline executed successfully');
      
      await this.updatePipelineRun(run);
      logger.info(`Pipeline completed successfully: ${runId}`);
    } catch (error) {
      run.status = 'failed';
      run.completedAt = new Date();
      await this.updatePipelineRun(run);
      logger.error(`Pipeline execution failed: ${runId}`, error);
    }
  }

  private async executeJob(job: PipelineJob, run: PipelineRun): Promise<void> {
    for (const command of job.commands) {
      run.logs.push(`$ ${command}`);
      
      // In real implementation, would execute actual commands
      // For now, simulate execution
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const output = `[Output] Command executed: ${command}`;
      run.logs.push(output);
    }

    // Handle artifacts
    if (job.artifacts && job.artifacts.length > 0) {
      run.artifacts.push(...job.artifacts);
      run.logs.push(`[Artifacts] Collected: ${job.artifacts.join(', ')}`);
    }
  }

  private evaluateCondition(condition: string): boolean {
    // Simple condition evaluation
    // In real implementation, would have more sophisticated logic
    return true;
  }

  private async updatePipelineRun(run: PipelineRun): Promise<void> {
    await this.db.query(
      `UPDATE ci_pipeline_runs
       SET status = $1, completed_at = $2, logs = $3, artifacts = $4
       WHERE id = $5`,
      [run.status, run.completedAt, JSON.stringify(run.logs), JSON.stringify(run.artifacts), run.id]
    );

    await this.redis.set(`pipeline:run:${run.id}`, JSON.stringify(run), 'EX', 3600);
  }

  async cancelPipelineRun(runId: string): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Pipeline run not found: ${runId}`);
    }

    run.status = 'canceled';
    run.completedAt = new Date();
    run.logs.push('[Canceled] Pipeline run was canceled');
    
    await this.updatePipelineRun(run);
    logger.info(`Pipeline run canceled: ${runId}`);
  }

  async getPipelineRun(runId: string): Promise<PipelineRun | null> {
    const cached = await this.redis.get(`pipeline:run:${runId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.db.query(
      'SELECT * FROM ci_pipeline_runs WHERE id = $1',
      [runId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      pipelineId: row.pipeline_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      logs: JSON.parse(row.logs || '[]'),
      artifacts: JSON.parse(row.artifacts || '[]')
    };
  }

  async getPipelineRuns(pipelineId: string, limit: number = 10): Promise<PipelineRun[]> {
    const result = await this.db.query(
      `SELECT * FROM ci_pipeline_runs 
       WHERE pipeline_id = $1 
       ORDER BY started_at DESC 
       LIMIT $2`,
      [pipelineId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      pipelineId: row.pipeline_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      logs: JSON.parse(row.logs || '[]'),
      artifacts: JSON.parse(row.artifacts || '[]')
    }));
  }

  async createGitHubActionsWorkflow(pipeline: PipelineConfig): Promise<string> {
    const workflow = {
      name: pipeline.name,
      on: this.getWorkflowTriggers(pipeline.trigger),
      jobs: this.convertToGitHubJobs(pipeline.stages)
    };

    const yaml = this.convertToYAML(workflow);
    return yaml;
  }

  private getWorkflowTriggers(trigger: string): any {
    switch (trigger) {
      case 'push':
        return { push: { branches: ['main', 'develop'] } };
      case 'pull_request':
        return { pull_request: { branches: ['main'] } };
      case 'schedule':
        return { schedule: [{ cron: '0 0 * * *' }] };
      default:
        return { workflow_dispatch: {} };
    }
  }

  private convertToGitHubJobs(stages: PipelineStage[]): Record<string, any> {
    const jobs: Record<string, any> = {};
    
    for (const stage of stages) {
      for (const job of stage.jobs) {
        jobs[job.name.toLowerCase().replace(/ /g, '-')] = {
          'runs-on': 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v2' },
            ...job.commands.map(cmd => ({ run: cmd }))
          ]
        };
      }
    }

    return jobs;
  }

  private convertToYAML(obj: any, indent: number = 0): string {
    let yaml = '';
    const spaces = ' '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.convertToYAML(value, indent + 2);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this.convertToYAML(item, indent + 4);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  async getArtifact(runId: string, artifactName: string): Promise<Buffer | null> {
    // In real implementation, would fetch actual artifact
    logger.info(`Fetching artifact: ${artifactName} from run: ${runId}`);
    return null;
  }

  async cleanupOldRuns(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.db.query(
      `DELETE FROM ci_pipeline_runs 
       WHERE completed_at < $1 
       RETURNING id`,
      [cutoffDate]
    );

    logger.info(`Cleaned up ${result.rowCount} old pipeline runs`);
    return result.rowCount || 0;
  }
}

export default CICDAutomationService;
