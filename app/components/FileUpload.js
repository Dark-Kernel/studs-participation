'use client'

import { useState, useRef, useEffect } from 'react'

const EVENT_OPTIONS = [
  { name: "Minds on Machines", code: "minds_on_machines" },
  { name: "Ravens Rebuttal", code: "ravens_rebuttal" },
  { name: "Nevermore", code: "nevermore" },
  { name: "BGMI", code: "bgmi" },
  { name: "CTF", code: "ctf" },
  { name: "ProtoTech", code: "prototech" },
]

export default function FileUpload({ onUpload, disabled, isReplace = false, replacingEvent = null }) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventCode, setEventCode] = useState('')
  const [isCustomEvent, setIsCustomEvent] = useState(false)
  const inputRef = useRef(null)

  // Pre-fill for replace mode
  useEffect(() => {
    if (isReplace && replacingEvent) {
      setEventName(replacingEvent.eventName)
      setEventCode(replacingEvent.eventCode)
      // Check if it's a custom event
      const isPreset = EVENT_OPTIONS.some(e => e.name === replacingEvent.eventName)
      setIsCustomEvent(!isPreset)
    }
  }, [isReplace, replacingEvent])

  // Auto-fill event code when event name changes
  useEffect(() => {
    if (!isCustomEvent) {
      const selected = EVENT_OPTIONS.find(e => e.name === eventName)
      if (selected) {
        setEventCode(selected.code)
      }
    }
  }, [eventName, isCustomEvent])

  // Generate event code from custom event name
  useEffect(() => {
    if (isCustomEvent && eventName) {
      const code = eventName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
      setEventCode(code)
    }
  }, [eventName, isCustomEvent])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleEventChange = (e) => {
    const value = e.target.value
    if (value === 'custom') {
      setIsCustomEvent(true)
      setEventName('')
      setEventCode('')
    } else {
      setIsCustomEvent(false)
      setEventName(value)
    }
  }

  const handleSubmit = async () => {
    if (!file || !eventName || !eventCode) return
    
    setParsing(true)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('eventName', eventName)
    formData.append('eventCode', eventCode)

    try {
      const response = await fetch('/api/r2', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload')
      }

      const result = await response.json()
      onUpload(result, isReplace, replacingEvent?.idx)
      
      // Reset form
      setFile(null)
      setEventName('')
      setEventCode('')
      setIsCustomEvent(false)
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setParsing(false)
    }
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="p-6 rounded-lg border mb-8" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        Upload Event Participants (Unstop / Scrollconnect)
      </h2>
      
      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Event Name *
          </label>
          <select
            value={isCustomEvent ? 'custom' : eventName}
            onChange={handleEventChange}
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
            disabled={disabled || parsing}
          >
            <option value="">Select an event...</option>
            {EVENT_OPTIONS.map((event) => (
              <option key={event.code} value={event.name}>
                {event.name}
              </option>
            ))}
            <option value="custom">+ Add Custom Event</option>
          </select>
          
          {isCustomEvent && (
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter custom event name"
              className="w-full mt-2 px-3 py-2 rounded-lg border"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
              disabled={disabled || parsing}
              autoFocus
            />
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Event Code (Auto-filled)
          </label>
          <input
            type="text"
            value={eventCode}
            readOnly
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {isCustomEvent ? 'Auto-generated from event name' : 'Auto-filled from selected event'}
          </p>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500' 
            : 'border-gray-600'
        }`}
        style={{ borderColor: dragActive ? 'var(--primary)' : 'var(--card-border)' }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
          disabled={disabled || parsing}
        />
        
        {file ? (
          <div className="space-y-2">
            <div className="text-4xl mb-2" style={{ color: 'var(--primary)' }}>#</div>
            <p style={{ color: 'var(--foreground)' }} className="font-medium">{file.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={() => setFile(null)}
              className="text-sm font-medium mt-2"
              style={{ color: '#ef4444' }}
              disabled={parsing}
            >
              Remove file
            </button>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2" style={{ color: 'var(--text-dim)' }}>+</div>
            <p className="mb-2" style={{ color: 'var(--foreground)' }}>
              Drag and drop your CSV or Excel file here
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Supports: Unstop and Scrollconnect exports
            </p>
            <button
              onClick={onButtonClick}
              className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'white' }}
              disabled={disabled || parsing}
            >
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {file && (
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={!eventName || !eventCode || parsing || disabled}
            className="w-full px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{ background: '#22c55e', color: 'white' }}
          >
            {parsing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Upload ${file.name}`
            )}
          </button>
        </div>
      )}

      <div className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <p className="font-medium mb-1">Supported formats:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Unstop:</strong> CSV exports with Team ID, Candidate's Name, Email columns</li>
          <li><strong>Scrollconnect:</strong> CSV exports with Name, Email, Institute columns</li>
        </ul>
      </div>
    </div>
  )
}
