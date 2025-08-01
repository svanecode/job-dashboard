export const handleModalKeyDown = (
  event: KeyboardEvent,
  onOpenJob: () => void,
  onClose: () => void,
  onPreviousJob?: () => void,
  onNextJob?: () => void
) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      onClose()
      break
    case 'o':
    case 'O':
      event.preventDefault()
      onOpenJob()
      break
    case 'ArrowLeft':
      if (onPreviousJob) {
        event.preventDefault()
        onPreviousJob()
      }
      break
    case 'ArrowRight':
      if (onNextJob) {
        event.preventDefault()
        onNextJob()
      }
      break
  }
}

export const createFocusTrap = (modalRef: React.RefObject<HTMLElement | null>) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (!focusableElements || focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  return handleKeyDown
} 