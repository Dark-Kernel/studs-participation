import { NextResponse } from 'next/server'
import { uploadToR2, listR2Files } from '@/lib/r2'
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
    const url = await uploadToR2(file, key)

    // Parse the file
    const parsed = await parseFile(file)

    return NextResponse.json({
      success: true,
      platform: parsed.platform,
      count: parsed.count,
      eventName,
      eventCode,
      key,
      url,
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

export async function GET() {
  try {
    const files = await listR2Files('uploads/')
    
    // Parse file names to extract event info
    const fileInfo = files.map(file => {
      const filename = file.key.replace('uploads/', '').replace('.csv', '').replace('.xlsx', '').replace('.xls', '')
      const parts = filename.split('_')
      const eventCode = parts[0]
      const timestamp = parts.slice(1).join('_')
      
      return {
        ...file,
        eventCode,
        originalName: file.key.replace('uploads/', '')
      }
    })

    return NextResponse.json({ files: fileInfo })
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}
