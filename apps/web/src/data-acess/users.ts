

import {
	useQuery,
  useMutation
} from "convex/react";
import { api } from "@murphy/backend/convex/_generated/api";





export const onboardUsers = () => {
  const onboard = useMutation(api.users.onboard);
}
