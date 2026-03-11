import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function normalizeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .sort()
    .join(' ')
}

function normalizeEmail(email) {
  if (!email || email === 'NULL' || email === 'null' || email === '') return null
  return email.toLowerCase().trim()
}

async function fetchAllCertificates() {
  const allData = []
  let page = 0
  const pageSize = 1000
  
  while (true) {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)
    
    if (error) {
      console.error('Error fetching page', page, error)
      break
    }
    
    if (!data || data.length === 0) {
      break
    }
    
    allData.push(...data)
    console.log(`Fetched page ${page + 1}: ${data.length} records (total: ${allData.length})`)
    
    if (data.length < pageSize) {
      break
    }
    
    page++
  }
  
  return allData
}

export async function GET() {
  try {
    // Fetch ALL certificates with pagination
    const data = await fetchAllCertificates()

    console.log(`\n=== Total certificates fetched: ${data.length} ===\n`)
    
    // Verify Mal Partho is in the data
    const malParthoCheck = data.find(c => c.name?.toLowerCase() === 'mal partho')
    console.log('✓ Mal Partho in fetched data:', malParthoCheck ? 'YES' : 'NO')

    // Build lookup tables
    const nameToEmail = new Map()
    const emailToName = new Map()
    
    data.forEach((cert) => {
      const normName = normalizeName(cert.name)
      const email = normalizeEmail(cert.email)
      
      if (normName) {
        if (email) {
          nameToEmail.set(normName, email)
          emailToName.set(email, normName)
        }
        if (!nameToEmail.has(normName)) {
          nameToEmail.set(normName, null)
        }
      }
    })

    console.log(`Name-Email mappings built: ${nameToEmail.size}`)
    console.log('mal partho ->', nameToEmail.get('mal partho'))

    // Group certificates by student
    const studentsMap = new Map()
    
    data.forEach((cert) => {
      const normName = normalizeName(cert.name)
      const email = normalizeEmail(cert.email)
      
      if (!normName) return
      
      let key
      if (email) {
        key = email
      } else {
        const linkedEmail = nameToEmail.get(normName)
        if (linkedEmail) {
          key = linkedEmail
        } else {
          key = normName
        }
      }
      
      if (!studentsMap.has(key)) {
        studentsMap.set(key, {
          names: new Set(),
          emails: new Set(),
          events: new Map(),
          certificates: []
        })
      }
      
      const student = studentsMap.get(key)
      
      if (cert.name) {
        student.names.add(cert.name.trim())
      }
      
      if (cert.email && cert.email !== 'NULL') {
        student.emails.add(cert.email)
      }
      
      const eventCode = cert.code || cert.event
      if (!student.events.has(eventCode)) {
        student.events.set(eventCode, {
          eventName: cert.event,
          eventCode: cert.code,
          imageUrl: cert.image_url,
          date: cert.created_at
        })
      }
      
      student.certificates.push({
        url: cert.image_url,
        event: cert.event,
        code: cert.code,
        date: cert.created_at
      })
    })

    console.log(`\nTotal students after grouping: ${studentsMap.size}`)

    // Check Partho specifically
    const parthoEmail = 'vu4f2223116@pvppcoe.ac.in'
    if (studentsMap.has(parthoEmail)) {
      const partho = studentsMap.get(parthoEmail)
      console.log('\n=== PARTHO MAL STUDENT ===')
      console.log('Names:', Array.from(partho.names))
      console.log('Emails:', Array.from(partho.emails))
      console.log('Event count:', partho.events.size)
      console.log('Events:', Array.from(partho.events.values()).map(e => e.eventName))
      console.log('========================\n')
    }

    // Convert to final format
    const students = Array.from(studentsMap.values()).map(student => {
      let bestName = Array.from(student.names).sort((a, b) => {
        const aHasSpace = a.includes(' ')
        const bHasSpace = b.includes(' ')
        if (aHasSpace && !bHasSpace) return -1
        if (!aHasSpace && bHasSpace) return 1
        return b.length - a.length
      })[0] || 'Unknown'
      
      const primaryEmail = Array.from(student.emails)[0] || 'Not provided'
      
      return {
        name: bestName,
        email: primaryEmail,
        eventCount: student.events.size,
        events: Array.from(student.events.values()).sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        ),
        allNames: Array.from(student.names),
        allEmails: Array.from(student.emails)
      }
    })

    // Calculate unique events
    const uniqueEvents = new Set()
    students.forEach(student => {
      student.events.forEach(event => {
        uniqueEvents.add(event.eventName?.toLowerCase())
      })
    })

    return NextResponse.json({ 
      students, 
      total: students.length,
      totalUniqueEvents: uniqueEvents.size
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
