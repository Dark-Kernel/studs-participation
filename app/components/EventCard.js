'use client'

import { useState } from 'react'

export default function EventCard({ event, onReplace, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-white">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {expanded ? '📂' : '📁'}
          </span>
          <div>
            <p className="font-medium text-gray-900">{event.eventName}</p>
            <p className="text-sm text-gray-500">
              {event.participants?.length || 0} participants • {event.platform}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onReplace}
            className="px-3 py-1 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded transition-colors"
          >
            🔄 Replace
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
          >
            🗑️
          </button>
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Event Code</p>
              <p className="font-mono text-gray-900">{event.eventCode}</p>
            </div>
            <div>
              <p className="text-gray-500">Platform</p>
              <p className="text-gray-900">{event.platform}</p>
            </div>
            <div>
              <p className="text-gray-500">Participants</p>
              <p className="text-gray-900">{event.participants?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">R2 Key</p>
              <p className="font-mono text-xs text-gray-500 truncate">{event.r2Key}</p>
            </div>
          </div>
          
          {event.participants && event.participants.length > 0 && (
            <div className="mt-3">
              <p className="text-gray-500 text-sm mb-2">Sample Participants:</p>
              <div className="max-h-32 overflow-y-auto bg-white rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs text-gray-500">Name</th>
                      <th className="px-2 py-1 text-left text-xs text-gray-500">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {event.participants.slice(0, 10).map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-2 py-1 truncate max-w-[150px]">{p.name}</td>
                        <td className="px-2 py-1 text-gray-500 truncate max-w-[150px]">{p.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {event.participants.length > 10 && (
                  <p className="px-2 py-1 text-xs text-gray-500 text-center">
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
