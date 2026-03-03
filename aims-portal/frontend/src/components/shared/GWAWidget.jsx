import { useState, useEffect } from 'react'
import api from '../../utils/api'

export default function GWAWidget({ studentId, semesterId = null, compact = false }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!studentId) return
    fetchGWA()
  }, [studentId, semesterId])

  const fetchGWA = async () => {
    setLoading(true)
    try {
      const url = semesterId
        ? `/students/${studentId}/gwa/semester?semesterId=${semesterId}`
        : `/students/${studentId}/gwa`
      const res = await api.get(url)
      setData(res.data.data)
    } catch (err) {
      console.error('Failed to load GWA')
    } finally {
      setLoading(false)
    }
  }

  const gwaColor = !data?.gwa ? 'text-gray-300' :
    data.gwa >= 90 ? 'text-green-600' :
    data.gwa >= 75 ? 'text-blue-600' :
    'text-red-600'

  const gwaLabel = !data?.gwa ? 'N/A' :
    data.gwa >= 90 ? 'Excellent' :
    data.gwa >= 85 ? 'Very Good' :
    data.gwa >= 80 ? 'Good' :
    data.gwa >= 75 ? 'Passing' :
    'Below Average'

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-24" />
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">
          {semesterId ? 'Semester GWA' : 'Overall GWA'}
        </p>
        <p className={`text-2xl font-bold ${gwaColor}`}>
          {data?.gwa ? `${data.gwa}%` : 'N/A'}
        </p>
        <p className={`text-xs font-medium mt-0.5 ${gwaColor}`}>{gwaLabel}</p>
        {data?.totalUnits > 0 && (
          <p className="text-xs text-gray-400 mt-1">{data.totalUnits} units computed</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">
            {semesterId ? 'Semester GWA' : 'Overall GWA'}
          </p>
          <div className="flex items-baseline gap-3">
            <span className={`text-3xl font-bold ${gwaColor}`}>
              {data?.gwa ? `${data.gwa}%` : 'N/A'}
            </span>
            <span className={`text-sm font-medium ${gwaColor}`}>{gwaLabel}</span>
          </div>
          {data?.totalUnits > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Based on {data.totalUnits} units — {data.breakdown?.length} subject(s)
            </p>
          )}
          {!data?.gwa && (
            <p className="text-xs text-gray-400 mt-1">No published grades yet</p>
          )}
        </div>
        {data?.breakdown?.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:underline flex-shrink-0"
          >
            {expanded ? 'Hide breakdown' : 'View breakdown'}
          </button>
        )}
      </div>

      {expanded && data?.breakdown?.length > 0 && (
        <div className="border-t border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Subject</th>
                <th className="text-center px-4 py-2 text-gray-500 font-medium">Units</th>
                <th className="text-center px-4 py-2 text-gray-500 font-medium">Grade</th>
                <th className="text-center px-4 py-2 text-gray-500 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.breakdown.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">
                    {item.subject}
                    {item.name && (
                      <span className="text-gray-400 font-normal ml-1">— {item.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-gray-500">{item.units}</td>
                  <td className={`px-4 py-2 text-center font-semibold ${item.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {item.grade?.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${item.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-600">GWA</td>
                <td className="px-4 py-2 text-center font-semibold text-gray-600">
                  {data.totalUnits} units
                </td>
                <td className={`px-4 py-2 text-center text-sm font-bold ${gwaColor}`}>
                  {data.gwa}%
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${data.gwa >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {gwaLabel}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}