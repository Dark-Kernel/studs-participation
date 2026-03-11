import { NextResponse } from 'next/server'
import { uploadToR2, updateEventInManifest, deleteR2File } from '@/lib/r2'
import { parseFile } from '@/lib/fileParser'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const eventName = formData.get('eventName')
    const eventCode = formData.get('eventCode')
    const replaceExisting = formData.get('replaceExisting') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!eventName || !eventCode) {
      return NextResponse.json({ error: 'Event name and code are required' }, { status: 400 })
    }

    // Generate R2 key
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const key = `uploads/${eventCode}_${timestamp}.${extension}`

    // Upload to R2
    await uploadToR2(file, key)

    // Parse the file
    const parsed = await parseFile(file)

    // Update manifest - this handles replacing old file reference
    const oldKey = await updateEventInManifest(eventCode, key, eventName, parsed.platform)
    
    console.log(`Updated manifest for ${eventCode}, old file was: ${oldKey}`)

    return NextResponse.json({
      success: true,
      platform: parsed.platform,
      count: parsed.count,
      eventName,
      eventCode,
      r2Key: key,
      oldR2Key: oldKey, // Return old key so frontend can delete if needed
      participants: parsed.data.map(row => ({
        name: row.name,
        email: row.email || null,
        platform: parsed.platform,
        event: eventName,
        code: eventCode,
        teamName: row.teamName || row.group || null,
        institute: row.institute || null,
        department: row.department || null,
        yearOfStudy: row.yearOfStudy || null,
        registrationTime: row.registrationTime || new Date().toISOString(),
        additionalData: row
      }))
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload' }, { status: 500 })
  }
}
