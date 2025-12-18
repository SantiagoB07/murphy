import { useAction } from "convex/react"
import { api } from "@murphy/backend/convex/_generated/api"

export const useOnboardUser = () => {
  const onboardUser = useAction(api.users.onboardUser)
  return onboardUser
}
