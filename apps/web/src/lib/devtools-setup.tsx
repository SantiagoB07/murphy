// devtools-setup.tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'


export default function Devtools() {
  return <TanStackDevtools plugins={[
    {
      name: "Tanstack Query",
      render: <ReactQueryDevtoolsPanel />,
    }
  ]} />
}
