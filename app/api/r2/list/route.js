import { NextResponse } from 'next/server'
import { listR2Files } from '@/lib/r2'
import { parseFile } from '@/lib/fileParser'

export async function GET() {
  try {
    const files = await listR2Files('uploads/')
    
    console.log(`Found ${files.length} files in R2`)
    
    const fileInfo = files.map(file => {
      const filename = file.key.replace('uploads/', '')
      const parts = filename.replace(/\.[^/.]+$/, '').split('_')
      const eventCode = parts[0] || 'unknown'
      
      return {
        key: file.key,
        url: file.url,
        eventCode,
        originalName: filename,
        size: file.size,
        lastModified: file.lastModified
      }
    })

    return NextResponse.json({ files: fileInfo })
  } catch (error) {
    console.error('Error fetching R2 files:', error)
    return NextResponse.json({ files: [], error: error.message }, { status: 200 })
  }
}
