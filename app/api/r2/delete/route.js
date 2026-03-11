import { NextResponse } from 'next/server'
import { deleteR2File, removeEventFromManifest } from '@/lib/r2'

export async function POST(request) {
  try {
    const { key, eventCode } = await request.json()
    
    if (eventCode) {
      // Remove from manifest (this also gets the file key to delete)
      const fileKey = await removeEventFromManifest(eventCode)
      
      if (fileKey) {
        await deleteR2File(fileKey)
        console.log(`Deleted file: ${fileKey} for event: ${eventCode}`)
      }
      
      return NextResponse.json({ success: true })
    }
    
    if (!key) {
      return NextResponse.json({ error: 'File key or event code is required' }, { status: 400 })
    }

    await deleteR2File(key)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
