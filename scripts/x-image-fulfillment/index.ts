import { config as loadEnv } from 'dotenv';
import { pathToFileURL } from 'node:url';

import { parseArgs } from './args';
import { writeOutputs } from './output';
import { buildPrompt, callXai, extractResult, fetchEvent, validateAssets } from './xai';

loadEnv({ path: '.env.local', override: false, quiet: true });
loadEnv({ quiet: true });

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const event = await fetchEvent(args);
  const prompt = buildPrompt(event);
  const { payload, response } = await callXai(prompt);
  const result = extractResult(response);
  const assets = await validateAssets(result.assets);
  const targetDir = await writeOutputs({
    event,
    outDir: args.outDir,
    payload,
    response,
    result: { ...result, assets },
  });

  console.log(`Saved xAI image fulfillment output to ${targetDir}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  void main();
}
