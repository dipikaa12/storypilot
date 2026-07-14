import { useWorkstream } from '../hooks/useWorkstream'

export default function Generate() {
  const { activeWorkstream } = useWorkstream()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Generate</h1>
      <p className="mt-2 text-gray-600">
        Convert BRD input into stories, Jira tickets, and Confluence pages.
      </p>
      {activeWorkstream && (
        <p className="mt-4 text-sm text-gray-500">
          Active workstream:{' '}
          <span className="font-medium text-gray-700">{activeWorkstream.name}</span>
        </p>
      )}
    </div>
  )
}
