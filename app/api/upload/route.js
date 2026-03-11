import { NextResponse } from 'next/server'
import { parseFile } from '@/lib/fileParser'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const eventName = formData.get('eventName')
    const eventCode = formData.get('eventCode')

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!eventName || !eventCode) {
      return NextResponse.json(
        { error: 'Event name and code are required' },
        { status: 400 }
      )
    }

    // Parse the file
    const parsed = await parseFile(file)

    // Transform data to standard format
    const participants = parsed.data.map(row => ({
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

    return NextResponse.json({
      success: true,
      platform: parsed.platform,
      count: participants.length,
      eventName,
      eventCode,
      participants
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    )
  }
}
