import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// Helper to read file as text (for server-side)
async function readFileAsText(file) {
  const bytes = await file.arrayBuffer()
  return new TextDecoder().decode(bytes)
}

// Helper to read file as buffer (for server-side)
async function readFileAsBuffer(file) {
  return await file.arrayBuffer()
}

export async function parseCSV(file) {
  const text = await readFileAsText(file)
  
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      complete: (results) => {
        resolve(results.data)
      },
      error: (error) => {
        reject(error)
      },
      header: true,
      skipEmptyLines: true
    })
  })
}

export async function parseCSVFromText(text) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      complete: (results) => {
        resolve(results.data)
      },
      error: (error) => {
        reject(error)
      },
      header: true,
      skipEmptyLines: true
    })
  })
}

export async function parseXLSX(file) {
  const buffer = await readFileAsBuffer(file)
  const data = new Uint8Array(buffer)
  const workbook = XLSX.read(data, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(firstSheet)
  return jsonData
}

export async function parseXLSXFromBuffer(buffer) {
  const data = new Uint8Array(buffer)
  const workbook = XLSX.read(data, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(firstSheet)
  return jsonData
}

export function detectPlatform(headers) {
  const headerStr = headers.join(',').toLowerCase()
  
  // Unstop has specific columns
  if (headerStr.includes('team id') && headerStr.includes('candidate\'s name') && headerStr.includes('candidate\'s email')) {
    return 'unstop'
  }
  
  // Scrollconnect has different columns
  if (headerStr.includes('prnno') || headerStr.includes('grno') || (headerStr.includes('teamcategory') && headerStr.includes('institute'))) {
    return 'scrollconnect'
  }
  
  return 'unknown'
}

export function parseUnstopData(data) {
  return data.map(row => ({
    platform: 'unstop',
    teamId: row['Team ID'] || '',
    teamName: row['Team Name'] || '',
    role: row['Candidate role'] || '',
    name: row["Candidate's Name"] || '',
    email: row["Candidate's Email"] || '',
    mobile: row["Candidate's Mobile"] || '',
    gender: row["Candidate's Gender"] || '',
    location: row["Candidate's Location"] || '',
    userType: row['User type'] || '',
    domain: row['Domain'] || '',
    course: row['Course'] || '',
    specialization: row['Specialization'] || '',
    institute: row["Candidate's Organisation"] || '',
    registrationTime: row['Registration Time'] || '',
    paymentStatus: row['Payment Status'] || ''
  })).filter(row => row.name) // Filter out empty rows
}

export function parseScrollconnectData(data) {
  return data.map(row => ({
    platform: 'scrollconnect',
    name: row['Name'] || '',
    email: row['Email'] || '',
    gender: row['Gender'] || '',
    group: row['Group'] || '',
    teamCategory: row['TeamCategory'] || '',
    institute: row['Institute'] || '',
    university: row['University'] || '',
    department: row['Department'] || '',
    yearOfStudy: row['YearOfStudy'] || '',
    division: row['Division'] || '',
    rollNumber: row['RollNumber'] || '',
    prnNo: row['PRNNo'] || '',
    grNo: row['GRNo'] || '',
    phoneNumber: row['PhoneNumber'] || '',
    state: row['State'] || '',
    district: row['District'] || ''
  })).filter(row => row.name) // Filter out empty rows
}

export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase()
  let data
  
  if (extension === 'csv') {
    data = await parseCSV(file)
  } else if (extension === 'xlsx' || extension === 'xls') {
    data = await parseXLSX(file)
  } else {
    throw new Error('Unsupported file format. Please upload CSV or XLSX.')
  }
  
  if (!data || data.length === 0) {
    throw new Error('No data found in file')
  }
  
  // Detect platform based on headers
  const headers = Object.keys(data[0])
  const platform = detectPlatform(headers)
  
  if (platform === 'unknown') {
    throw new Error('Could not detect file format. Please ensure you\'re uploading Unstop or Scrollconnect data.')
  }
  
  // Parse based on platform
  let parsedData
  if (platform === 'unstop') {
    parsedData = parseUnstopData(data)
  } else if (platform === 'scrollconnect') {
    parsedData = parseScrollconnectData(data)
  }
  
  return {
    platform,
    data: parsedData,
    count: parsedData.length
  }
}

// Parse from blob (for R2 fetches)
export async function parseFromBlob(blob, filename) {
  const extension = filename.split('.').pop()?.toLowerCase()
  let data
  
  console.log(`Parsing ${filename} as ${extension}`)
  
  if (extension === 'csv') {
    // Read blob as text
    const text = await blob.text()
    console.log(`CSV text length: ${text.length} chars`)
    data = await parseCSVFromText(text)
  } else if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await blob.arrayBuffer()
    data = await parseXLSXFromBuffer(buffer)
  } else {
    throw new Error('Unsupported file format. Please upload CSV or XLSX.')
  }
  
  console.log(`Parsed ${data?.length || 0} rows`)
  
  if (!data || data.length === 0) {
    throw new Error('No data found in file')
  }
  
  // Detect platform based on headers
  const headers = Object.keys(data[0])
  console.log('Headers:', headers.slice(0, 5))
  const platform = detectPlatform(headers)
  console.log('Detected platform:', platform)
  
  if (platform === 'unknown') {
    throw new Error('Could not detect file format. Please ensure you\'re uploading Unstop or Scrollconnect data.')
  }
  
  // Parse based on platform
  let parsedData
  if (platform === 'unstop') {
    parsedData = parseUnstopData(data)
  } else if (platform === 'scrollconnect') {
    parsedData = parseScrollconnectData(data)
  }
  
  return {
    platform,
    data: parsedData,
    count: parsedData.length
  }
}

// Parse from Buffer (for R2 S3 API)
export async function parseFromBuffer(buffer, filename) {
  const extension = filename.split('.').pop()?.toLowerCase()
  let data
  
  console.log(`Parsing ${filename} as ${extension}, buffer size: ${buffer.length}`)
  
  if (extension === 'csv') {
    const text = new TextDecoder().decode(buffer)
    console.log(`CSV text length: ${text.length} chars`)
    data = await parseCSVFromText(text)
  } else if (extension === 'xlsx' || extension === 'xls') {
    data = await parseXLSXFromBuffer(buffer)
  } else {
    throw new Error('Unsupported file format. Please upload CSV or XLSX.')
  }
  
  console.log(`Parsed ${data?.length || 0} rows`)
  
  if (!data || data.length === 0) {
    throw new Error('No data found in file')
  }
  
  // Detect platform based on headers
  const headers = Object.keys(data[0])
  console.log('Headers:', headers.slice(0, 5))
  const platform = detectPlatform(headers)
  console.log('Detected platform:', platform)
  
  if (platform === 'unknown') {
    throw new Error('Could not detect file format. Please ensure you\'re uploading Unstop or Scrollconnect data.')
  }
  
  // Parse based on platform
  let parsedData
  if (platform === 'unstop') {
    parsedData = parseUnstopData(data)
  } else if (platform === 'scrollconnect') {
    parsedData = parseScrollconnectData(data)
  }
  
  return {
    platform,
    data: parsedData,
    count: parsedData.length
  }
}
