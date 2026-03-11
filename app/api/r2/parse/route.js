import { NextResponse } from 'next/server'
import { getManifest, getR2FileContent, deleteR2File } from '@/lib/r2'
import { parseFromBuffer } from '@/lib/fileParser'

export async function POST(request) {
  try {
    // Get manifest to find current files
    const manifest = await getManifest()
    const events = manifest.events || {}
    
    console.log('Manifest events:', Object.keys(events))
    
    const allParticipants = []
    const fileResults = []

    // Process each event from manifest
    for (const [eventCode, eventData] of Object.entries(events)) {
      try {
        const fileKey = eventData.fileKey
        console.log(`Processing ${eventCode}: ${fileKey}`)
        
        const buffer = await getR2FileContent(fileKey)
        console.log(`Buffer size: ${buffer.length} bytes`)
        
        const parsed = await parseFromBuffer(buffer, fileKey)
        
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
          r2Key: fileKey
        }))
        
        allParticipants.push(...participants)
        
        fileResults.push({
          key: fileKey,
          eventCode,
          eventName: eventData.eventName,
          platform: eventData.platform,
          updatedAt: eventData.updatedAt,
          count: participants.length
        })
        
        console.log(`Parsed ${participants.length} from ${eventCode}`)
      } catch (err) {
        console.error(`Error processing ${eventCode}:`, err.message)
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
