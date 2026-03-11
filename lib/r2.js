import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'itsa-events'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn('⚠️ R2 credentials not configured. File uploads will not work.')
}

export const r2Client = R2_ACCOUNT_ID ? new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
}) : null

export async function uploadToR2(file, key) {
  if (!r2Client) {
    throw new Error('R2 not configured')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const upload = new Upload({
    client: r2Client,
    params: {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'text/csv',
    },
  })

  await upload.done()
  
  // Return public URL if configured
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }
  
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
}

export async function listR2Files(prefix = '') {
  if (!r2Client) {
    console.log('R2 client not initialized - missing credentials')
    return []
  }

  console.log('Listing R2 files with bucket:', R2_BUCKET_NAME, 'prefix:', prefix)

  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix,
  })

  try {
    const response = await r2Client.send(command)
    console.log('R2 response:', response.Contents?.length || 0, 'files')
    
    return (response.Contents || []).map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: R2_PUBLIC_URL 
        ? `${R2_PUBLIC_URL}/${item.Key}`
        : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${item.Key}`
    }))
  } catch (err) {
    console.error('Error listing R2 files:', err)
    return []
  }
}

export async function deleteR2File(key) {
  if (!r2Client) {
    throw new Error('R2 not configured')
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

export async function getR2FileContent(key) {
  if (!r2Client) {
    throw new Error('R2 not configured')
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  const response = await r2Client.send(command)
  
  // Convert the streaming body to a Buffer
  const chunks = []
  for await (const chunk of response.Body) {
    chunks.push(chunk)
  }
  
  return Buffer.concat(chunks)
}

export async function getR2FileUrl(key) {
  if (!R2_PUBLIC_URL) {
    return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com}/${key}`
  }
  return `${R2_PUBLIC_URL}/${key}`
}
