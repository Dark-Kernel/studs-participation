import { NextResponse } from 'next/server'
import { listR2Files, getR2FileUrl } from '@/lib/r2'

export async function POST(request) {
  try {
    const body = await request.json()
    const eventCodes = body.eventCodes || []

    if (!eventCodes || eventCodes.length === 0) {
      // Get all files
      const files = await listR2Files('uploads/')
      return NextResponse.json({ files })
    }

    // Filter files by event codes
    const allFiles = await listR2Files('uploads/')
    const matchingFiles = allFiles.filter(file => 
      eventCodes.some(code => file.key.includes(code))
    )

    return NextResponse.json({ files: matchingFiles })
  } catch (error) {
    console.error('Error fetching R2 files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
