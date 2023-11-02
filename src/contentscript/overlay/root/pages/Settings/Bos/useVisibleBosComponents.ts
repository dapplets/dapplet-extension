import { useEffect, useState } from 'react'

const EXCLUDED_COMPONENTS = ['near/widget/TosCheck']

export function useVisibleBosComponents() {
  const [inViewComponents, setInViewComponents] = useState<string[]>([])

  useEffect(() => {
    const widgets = Array.from(document.querySelectorAll('.dapplet-widget'))
    const bosComponents = widgets
      .map((el) =>
        Array.from(el.shadowRoot.querySelectorAll('*[data-component]')).map((bos) =>
          bos.getAttribute('data-component')
        )
      )
      .flat()
    const uniqueIds = Array.from(new Set(bosComponents)).filter(
      (comp) => !EXCLUDED_COMPONENTS.includes(comp)
    )

    setInViewComponents(uniqueIds)
  }, [])

  return inViewComponents
}
