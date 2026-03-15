import { spawnSync } from 'node:child_process';

type RunOptions = {
  args: string[];
  command: string;
  env?: NodeJS.ProcessEnv;
  input?: string | Buffer;
};

export function run({ args, command, env, input }: RunOptions) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: env ?? process.env,
    input,
    stdio: input ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
  });
  if (result.status === 0) return result.stdout.trim();
  throw new Error(result.stderr.trim() || `${command} exited with ${result.status}`);
}
