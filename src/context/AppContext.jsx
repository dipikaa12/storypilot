import { createContext, useContext, useEffect, useReducer } from 'react'
import {
  createWorkstreamId,
  loadActiveWorkstreamId,
  loadHistory,
  loadSettings,
  loadWorkstreams,
  saveActiveWorkstreamId,
  saveHistory,
  saveSettings,
  saveWorkstreams,
} from '../lib/storage'

const AppContext = createContext(null)

const initialState = {
  workstreams: [],
  activeWorkstreamId: null,
  settings: loadSettings(),
  history: [],
  hydrated: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const workstreams = loadWorkstreams()
      const activeWorkstreamId = loadActiveWorkstreamId(workstreams)
      const history = loadHistory()
      return { ...state, workstreams, activeWorkstreamId, history, hydrated: true }
    }
    case 'SET_ACTIVE_WORKSTREAM': {
      saveActiveWorkstreamId(action.payload)
      return { ...state, activeWorkstreamId: action.payload }
    }
    case 'ADD_WORKSTREAM': {
      const workstreams = [...state.workstreams, action.payload]
      saveWorkstreams(workstreams)
      saveActiveWorkstreamId(action.payload.id)
      return { ...state, workstreams, activeWorkstreamId: action.payload.id }
    }
    case 'UPDATE_WORKSTREAM': {
      const workstreams = state.workstreams.map((ws) =>
        ws.id === action.payload.id
          ? { ...action.payload, updatedAt: new Date().toISOString() }
          : ws
      )
      saveWorkstreams(workstreams)
      return { ...state, workstreams }
    }
    case 'DELETE_WORKSTREAM': {
      const workstreams = state.workstreams.filter((ws) => ws.id !== action.payload)
      saveWorkstreams(workstreams)
      const activeWorkstreamId =
        state.activeWorkstreamId === action.payload
          ? workstreams[0]?.id ?? null
          : state.activeWorkstreamId
      if (activeWorkstreamId) saveActiveWorkstreamId(activeWorkstreamId)
      return { ...state, workstreams, activeWorkstreamId }
    }
    case 'SET_SETTINGS': {
      saveSettings(action.payload)
      return { ...state, settings: action.payload }
    }
    case 'SET_HISTORY': {
      saveHistory(action.payload)
      return { ...state, history: action.payload }
    }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({ type: 'HYDRATE' })
  }, [])

  const activeWorkstream =
    state.workstreams.find((ws) => ws.id === state.activeWorkstreamId) ?? null

  const value = {
    ...state,
    activeWorkstream,
    dispatch,
    setActiveWorkstream: (id) => dispatch({ type: 'SET_ACTIVE_WORKSTREAM', payload: id }),
    addWorkstream: (data) => {
      const now = new Date().toISOString()
      const workstream = {
        id: createWorkstreamId(),
        confluenceSpaceKey: '',
        confluenceParentPageId: '',
        jiraProjectKey: '',
        createdAt: now,
        updatedAt: now,
        ...data,
      }
      dispatch({ type: 'ADD_WORKSTREAM', payload: workstream })
      return workstream
    },
    updateWorkstream: (workstream) =>
      dispatch({ type: 'UPDATE_WORKSTREAM', payload: workstream }),
    deleteWorkstream: (id) => dispatch({ type: 'DELETE_WORKSTREAM', payload: id }),
    updateSettings: (settings) => dispatch({ type: 'SET_SETTINGS', payload: settings }),
    setHistory: (history) => dispatch({ type: 'SET_HISTORY', payload: history }),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
