import type { Job } from 'bullmq';

export type JobProcessor = (job: Job) => Promise<unknown>;

export type WorkloadClass = 'realtime' | 'standard' | 'heavy';

export type JobDefinition = {
  name: string;
  interval: number;
  enabled: boolean;
  processor: JobProcessor;
  workload: WorkloadClass;
};
