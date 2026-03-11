'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Fuse from 'fuse.js'

export default function FacultySearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState([])
  const [totalUniqueEvents, setTotalUniqueEvents] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [fuse, setFuse] = useState(null)

  // Fetch students data on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students')
        if (!response.ok) {
          throw new Error('Failed to fetch students')
        }
        const data = await response.json()
        setStudents(data.students || [])
        setTotalUniqueEvents(data.totalUniqueEvents || 0)
        
        // Initialize Fuse.js for fuzzy search
        const fuseOptions = {
          keys: ['name', 'email'],
          threshold: 0.4,
          distance: 100,
          includeScore: true,
          includeMatches: true,
        }
        setFuse(new Fuse(data.students || [], fuseOptions))
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return students
    }

    if (fuse) {
      const results = fuse.search(searchQuery)
      return results.map(result => ({
        ...result.item,
        score: result.score,
        matches: result.matches
      }))
    }

    // Fallback to simple search if Fuse isn't initialized
    return students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, students, fuse])

  const handleStudentClick = useCallback((student) => {
    setSelectedStudent(student)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedStudent(null)
  }, [])

  // Statistics
  const stats = useMemo(() => {
    const totalStudents = students.length
    const compliantStudents = students.filter(s => s.eventCount >= 2).length
    const nonCompliantStudents = totalStudents - compliantStudents
    const totalEvents = students.reduce((sum, s) => sum + s.eventCount, 0)
    const averageEvents = totalStudents > 0 ? (totalEvents / totalStudents).toFixed(1) : 0

    return {
      totalStudents,
      compliantStudents,
      nonCompliantStudents,
      totalEvents,
      averageEvents,
      totalUniqueEvents
    }
  }, [students, totalUniqueEvents])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ITSA Events Board
              </h1>
              <p className="text-gray-600 mt-1">
                Faculty Portal - Student Event Participation Search
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Information Technology Department</p>
              <p className="text-sm text-gray-500">HOD Requirement: Minimum 2 events per semester</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Compliant (≥2 events)</p>
            <p className="text-2xl font-bold text-green-600">{stats.compliantStudents}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Non-Compliant</p>
            <p className="text-2xl font-bold text-red-600">{stats.nonCompliantStudents}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Unique Events</p>
            <p className="text-2xl font-bold text-blue-600">{totalUniqueEvents}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">Avg Events/Student</p>
            <p className="text-2xl font-bold text-purple-600">{stats.averageEvents}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Students
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Enter student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <svg
              className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery ? (
              <span>
                Found {filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''} 
                {filteredStudents.length > 0 && filteredStudents[0].score !== undefined && (
                  <span className="ml-2 text-blue-600">
                    (Best match: {((1 - filteredStudents[0].score) * 100).toFixed(0)}% similarity)
                  </span>
                )}
              </span>
            ) : (
              <span>Showing all {students.length} students</span>
            )}
          </p>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student, index) => (
            <div
              key={index}
              onClick={() => handleStudentClick(student)}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    student.eventCount >= 2
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {student.eventCount} event{student.eventCount !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Participation</span>
                  <span
                    className={`font-medium ${
                      student.eventCount >= 2 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {student.eventCount >= 2 ? '✓ Compliant' : '✗ Needs more'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      student.eventCount >= 2 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min((student.eventCount / 2) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Recent Events:</p>
                {student.events.slice(0, 3).map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span className="truncate">{event.eventName}</span>
                  </div>
                ))}
                {student.events.length > 3 && (
                  <p className="text-sm text-blue-600 font-medium">
                    +{student.events.length - 3} more events
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No students found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms or check the spelling
            </p>
          </div>
        )}
      </main>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedStudent.name}
                  </h2>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Event Participation
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedStudent.eventCount >= 2
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedStudent.eventCount} event{selectedStudent.eventCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Compliance Status</span>
                    <span
                      className={`text-sm font-medium ${
                        selectedStudent.eventCount >= 2
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {selectedStudent.eventCount >= 2
                        ? '✓ Meets HOD requirement (2+ events)'
                        : `✗ Needs ${2 - selectedStudent.eventCount} more event(s)`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        selectedStudent.eventCount >= 2 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min((selectedStudent.eventCount / 2) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedStudent.events.map((event, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {event.eventName}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Code: {event.eventCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            Date: {new Date(event.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {event.imageUrl && (
                          <a
                            href={event.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-4"
                          >
                            View Certificate →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
