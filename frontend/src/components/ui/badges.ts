export const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    draft:       'badge badge-gray',
    processing:  'badge badge-blue',
    transcribed: 'badge badge-purple',
    summarized:  'badge badge-amber',
    completed:   'badge badge-green',
    failed:      'badge badge-red',
  }
  return map[status] ?? 'badge badge-gray'
}

export const priorityBadge = (priority: string) => {
  const map: Record<string, string> = {
    high:   'badge badge-red',
    medium: 'badge badge-amber',
    low:    'badge badge-green',
  }
  return map[priority] ?? 'badge badge-gray'
}

export const actionStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending:     'badge badge-amber',
    in_progress: 'badge badge-blue',
    done:        'badge badge-green',
    cancelled:   'badge badge-gray',
  }
  return map[status] ?? 'badge badge-gray'
}
