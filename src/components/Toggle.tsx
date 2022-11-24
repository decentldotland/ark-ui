import { Switch } from '@headlessui/react'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Toggle({enabled, setEnabled}: {enabled: boolean, setEnabled: (enabled: boolean) => void}) {

  return (
    <Switch
      checked={enabled}
      onChange={() => setEnabled(!enabled)}
      className={classNames(
        !enabled ? 'bg-[rgb(38,191,168)]' : 'bg-indigo-500',
        'relative inline-flex h-6 pt-[2px] w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={classNames(
          !enabled ? 'translate-x-[25px]' : 'translate-x-[3px]',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        )}
      />
    </Switch>
  )
}