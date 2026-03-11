import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch certificates' },
        { status: 500 }
      )
    }

    // Group certificates by student name
    const studentsMap = new Map()
    
    data.forEach((cert) => {
      const normalizedName = cert.name?.toLowerCase().trim() || 'unknown'
      const email = cert.email?.toLowerCase().trim() || null
      
      // Use email as key if available, otherwise use name
      const key = email || normalizedName
      
      if (!studentsMap.has(key)) {
        studentsMap.set(key, {
          name: cert.name?.trim() || 'Unknown',
          email: cert.email || 'Not provided',
          events: [],
          eventCount: 0,
          certificates: []
        })
      }
      
      const student = studentsMap.get(key)
      student.events.push({
        eventName: cert.event,
        eventCode: cert.code,
        imageUrl: cert.image_url,
        date: cert.created_at
      })
      student.eventCount = student.events.length
      student.certificates.push(cert.image_url)
    })

    const students = Array.from(studentsMap.values())
    
    return NextResponse.json({ students, total: students.length })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
