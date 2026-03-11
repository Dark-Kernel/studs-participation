'use client'

import { useState } from 'react'

export default function EventCard({ event, onReplace, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div style={{ background: 'var(--card-bg)' }}>
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        style={{ borderColor: 'var(--card-border)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg" style={{ color: 'var(--text-dim)' }}>
            {expanded ? '[-]' : '[+]'}
          </span>
          <div>
            <p className="font-medium" style={{ color: 'var(--foreground)' }}>{event.eventName}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {event.participants?.length || 0} participants | {event.platform}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onReplace}
            className="px-3 py-1 text-sm rounded"
            style={{ background: '#f97316', color: 'white' }}
            onMouseOver={(e) => e.target.style.background = '#ea580c'}
            onMouseOut={(e) => e.target.style.background = '#f97316'}
          >
            Replace
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm rounded"
            style={{ background: '#dc2626', color: 'white' }}
            onMouseOver={(e) => e.target.style.background = '#b91c1c'}
            onMouseOut={(e) => e.target.style.background = '#dc2626'}
          >
            Del
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 py-3 border-t" style={{ background: 'var(--input-bg)', borderColor: 'var(--card-border)' }}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Event Code</p>
              <p className="font-mono" style={{ color: 'var(--foreground)' }}>{event.eventCode}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Platform</p>
              <p style={{ color: 'var(--foreground)' }}>{event.platform}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Participants</p>
              <p style={{ color: 'var(--foreground)' }}>{event.participants?.length || 0}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>R2 Key</p>
              <p className="font-mono text-xs truncate" style={{ color: 'var(--text-dim)' }}>{event.r2Key}</p>
            </div>
          </div>
          
          {event.participants && event.participants.length > 0 && (
            <div className="mt-3">
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Sample Participants:</p>
              <div className="max-h-32 overflow-y-auto rounded border" style={{ borderColor: 'var(--card-border)' }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ background: 'var(--card-bg)' }}>
                    <tr>
                      <th className="px-2 py-1 text-left text-xs" style={{ color: 'var(--text-muted)' }}>Name</th>
                      <th className="px-2 py-1 text-left text-xs" style={{ color: 'var(--text-muted)' }}>Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                    {event.participants.slice(0, 10).map((p, i) => (
                      <tr key={i} style={{ background: 'var(--card-bg)' }}>
                        <td className="px-2 py-1 truncate max-w-[150px]" style={{ color: 'var(--foreground)' }}>{p.name}</td>
                        <td className="px-2 py-1 truncate max-w-[150px]" style={{ color: 'var(--text-muted)' }}>{p.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {event.participants.length > 10 && (
                  <p className="px-2 py-1 text-xs text-center" style={{ color: 'var(--text-dim)' }}>
                    +{event.participants.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
