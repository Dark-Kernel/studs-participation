import { NextResponse } from 'next/server'
import { listR2Files, getManifest, saveManifest, getR2FileContent } from '@/lib/r2'
import { parseFromBuffer } from '@/lib/fileParser'

export async function POST(request) {
  try {
    // First, get existing manifest
    let manifest = await getManifest()
    const existingEvents = Object.keys(manifest.events)
    console.log('Existing manifest events:', existingEvents)
    
    // List all files in uploads/
    const files = await listR2Files('uploads/')
    console.log('All files in R2:', files.map(f => f.key))
    
    // Filter out manifest.json and process each file
    const uploadFiles = files.filter(f => f.key !== 'manifest.json' && !f.key.endsWith('/'))
    console.log('Upload files:', uploadFiles.map(f => f.key))
    
    // For each file, detect event code and add to manifest
    for (const file of uploadFiles) {
      const filename = file.key.replace('uploads/', '')
      const eventCode = filename.replace(/\.[^/.]+$/, '').split('_')[0]
      
      // Skip if already in manifest
      if (manifest.events[eventCode]) {
        console.log(`Skipping ${eventCode} - already in manifest`)
        continue
      }
      
      try {
        // Parse to detect platform
        const buffer = await getR2FileContent(file.key)
        const parsed = await parseFromBuffer(buffer, filename)
        
        // Format event name
        const eventName = eventCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        
        manifest.events[eventCode] = {
          fileKey: file.key,
          eventName,
          platform: parsed.platform,
          updatedAt: new Date().toISOString()
        }
        
        console.log(`Added ${eventCode} to manifest: ${parsed.platform}`)
      } catch (err) {
        console.error(`Error processing ${file.key}:`, err.message)
      }
    }
    
    // Save the updated manifest
    await saveManifest(manifest)
    
    return NextResponse.json({
      success: true,
      message: 'Manifest updated',
      events: Object.keys(manifest.events),
      manifest
    })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
