import { useEffect, useState } from 'react'
import CopyButton from './CopyButton'

const TAB_CONFIG = {
  stories: { label: 'Stories' },
  confluence: { label: 'Confluence' },
}

export default function OutputTabs({ outputs, selectedOutputs }) {
  const tabs = selectedOutputs.filter((key) => TAB_CONFIG[key])
  const [activeTab, setActiveTab] = useState(tabs[0] ?? 'stories')

  useEffect(() => {
    if (!tabs.includes(activeTab)) setActiveTab(tabs[0] ?? 'stories')
  }, [tabs, activeTab])

  const currentTab = tabs.includes(activeTab) ? activeTab : tabs[0]
  const content = outputs[currentTab] ?? ''

  if (!tabs.length) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex">
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                currentTab === key
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {TAB_CONFIG[key].label}
            </button>
          ))}
        </div>
        <div className="px-3 pb-1">
          <CopyButton text={content} />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  )
}
