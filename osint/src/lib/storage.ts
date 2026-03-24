import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { config } from '../config.js';

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: true, // required for MinIO
});

export async function uploadRaw(key: string, body: Buffer): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: body,
    }),
  );
  return key;
}
