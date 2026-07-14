import { useApp } from '../context/AppContext'

export function useWorkstream() {
  const {
    workstreams,
    activeWorkstream,
    activeWorkstreamId,
    setActiveWorkstream,
    addWorkstream,
    updateWorkstream,
    deleteWorkstream,
  } = useApp()

  return {
    workstreams,
    activeWorkstream,
    activeWorkstreamId,
    setActiveWorkstream,
    addWorkstream,
    updateWorkstream,
    deleteWorkstream,
  }
}
