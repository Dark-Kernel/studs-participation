import { NextResponse } from 'next/server'
import { listR2Files, getR2FileContent } from '@/lib/r2'
import { parseFromBuffer } from '@/lib/fileParser'

export async function POST(request) {
  try {
    const body = await request.json()
    const eventCodes = body.eventCodes || []

    // Get all files from R2
    const files = await listR2Files('uploads/')
    
    // Filter by event codes if specified
    let filteredFiles = files
    if (eventCodes && eventCodes.length > 0) {
      filteredFiles = files.filter(file => 
        eventCodes.some(code => file.key.includes(code))
      )
    }

    console.log(`Fetching ${filteredFiles.length} files from R2`)

    // If no files, return early with empty data
    if (filteredFiles.length === 0) {
      return NextResponse.json({
        success: true,
        files: [],
        participants: [],
        totalCount: 0
      })
    }

    // Fetch and parse each file
    const allParticipants = []
    const fileResults = []

    for (const file of filteredFiles) {
      try {
        // Skip directory markers
        if (file.key.endsWith('/')) {
          console.log('Skipping directory:', file.key)
          continue
        }
        
        // Extract event code from filename
        const fullFileName = file.key.replace('uploads/', '')
        const fileExtension = fullFileName.split('.').pop()?.toLowerCase()
        const eventCode = fullFileName.replace(/\.[^/.]+$/, '').split('_')[0]
        
        console.log(`Processing file: ${file.key}, extension: ${fileExtension}`)
        
        // Fetch file content directly from R2
        let buffer
        try {
          buffer = await getR2FileContent(file.key)
          console.log(`Buffer size: ${buffer.length} bytes`)
        } catch (fetchError) {
          console.error(`Failed to fetch ${file.key}:`, fetchError.message)
          continue
        }
        
        if (!buffer || buffer.length === 0) {
          console.log('Skipping empty file:', file.key)
          continue
        }
        
        // Parse using buffer
        const parsed = await parseFromBuffer(buffer, fullFileName)
        
        const participants = parsed.data.map(row => ({
          name: row.name,
          email: row.email || null,
          platform: parsed.platform,
          event: eventCode,
          code: eventCode,
          teamName: row.teamName || row.group || null,
          institute: row.institute || null,
          department: row.department || null,
          yearOfStudy: row.yearOfStudy || null,
          registrationTime: row.registrationTime || new Date().toISOString(),
          r2Key: file.key
        }))
        
        allParticipants.push(...participants)
        
        fileResults.push({
          key: file.key,
          eventCode,
          platform: parsed.platform,
          count: participants.length
        })
        
        console.log(`Parsed ${participants.length} participants from ${file.key}`)
      } catch (fileError) {
        console.error(`Error parsing file ${file.key}:`, fileError)
      }
    }

    return NextResponse.json({
      success: true,
      files: fileResults,
      participants: allParticipants,
      totalCount: allParticipants.length
    })
  } catch (error) {
    console.error('Error fetching R2 data:', error)
    return NextResponse.json({ 
      error: error.message,
      files: [],
      participants: [],
      totalCount: 0 
    }, { status: 200 })
  }
}
