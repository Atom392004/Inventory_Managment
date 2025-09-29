import { Fragment } from 'react'
import { Transition } from '@headlessui/react'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
}

const colors = {
  success: 'text-success-500',
  error: 'text-danger-500',
  info: 'text-info-500',
  warning: 'text-warning-500',
}

export type ToastProps = {
  visible: boolean
  type?: keyof typeof icons
  title: string
  message?: string
  onDismiss: () => void
}

export function Toast({ visible, type = 'info', title, message, onDismiss }: ToastProps) {
  const Icon = icons[type]

  return (
    <Transition
      show={visible}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`h-6 w-6 ${colors[type]}`} aria-hidden="true" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{title}</p>
              {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={onDismiss}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  )
}

export const showToast = {
  success: (title: string, message?: string) => toast.custom((t) => <Toast visible={t.visible} type="success" title={title} message={message} onDismiss={() => toast.dismiss(t.id)} />),
  error: (title: string, message?: string) => toast.custom((t) => <Toast visible={t.visible} type="error" title={title} message={message} onDismiss={() => toast.dismiss(t.id)} />),
  info: (title: string, message?: string) => toast.custom((t) => <Toast visible={t.visible} type="info" title={title} message={message} onDismiss={() => toast.dismiss(t.id)} />),
  warning: (title: string, message?: string) => toast.custom((t) => <Toast visible={t.visible} type="warning" title={title} message={message} onDismiss={() => toast.dismiss(t.id)} />),
}