import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { extname, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { writeFile, mkdir, unlink } from 'fs/promises';

const USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true';
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;

let s3Client = null;

function getS3Client() {
  if (!s3Client && USE_CLOUD_STORAGE) {
    if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY || !S3_BUCKET) {
      throw new Error('Cloud storage configuration incomplete. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET');
    }
    s3Client = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
    });
  }
  return s3Client;
}

function getKey(fileName) {
  const id = uuidv4();
  const ext = extname(fileName).toLowerCase();
  return `${id}${ext}`;
}

function getPublicUrl(key) {
  if (USE_CLOUD_STORAGE && S3_PUBLIC_URL) {
    return `${S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  return `/uploads/${key}`;
}

async function getLocalUploadsDir() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, '..', 'uploads');
}

export async function uploadFile(file, key = null) {
  const fileKey = key || getKey(file.originalname);
  let buffer = file.buffer;
  
  if (!buffer && file.stream) {
    const chunks = [];
    for await (const chunk of file.stream) {
      chunks.push(chunk);
    }
    buffer = Buffer.concat(chunks);
  }

  if (USE_CLOUD_STORAGE) {
    const client = getS3Client();
    await client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }));
    return { key: fileKey, url: getPublicUrl(fileKey) };
  } else {
    const uploadsDir = await getLocalUploadsDir();
    await mkdir(uploadsDir, { recursive: true });
    const filePath = join(uploadsDir, fileKey);
    await writeFile(filePath, buffer);
    
    return { key: fileKey, url: getPublicUrl(fileKey) };
  }
}

export async function deleteFile(key) {
  if (USE_CLOUD_STORAGE) {
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));
  } else {
    const uploadsDir = await getLocalUploadsDir();
    const filePath = join(uploadsDir, key);
    
    try {
      await unlink(filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}

export async function getSignedDownloadUrl(key, expiresIn = 3600) {
  if (USE_CLOUD_STORAGE) {
    const client = getS3Client();
    return await getSignedUrl(client, new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }), { expiresIn });
  }
  return getPublicUrl(key);
}

export function isCloudStorageEnabled() {
  return USE_CLOUD_STORAGE;
}