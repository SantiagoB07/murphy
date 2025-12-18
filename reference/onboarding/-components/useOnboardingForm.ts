import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Schema } from "effect";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { onboardUserOptions } from "@/data-access/users";
import { OnboardUserPayload } from "@/server/schemas/user";
import { routes } from "@/lib/routes";

export function useOnboardingForm() {
  const [selectedUserType, setSelectedUserType] = useState<
    "explorer" | "business" | null
  >(null);

  const { user } = useUser();

  const { mutate: onBoardUser, isPending } = useMutation({
    ...onboardUserOptions,
    throwOnError: false,
    onError: (error) => {
      error.match({
        Unauthenticated: () => {
          toast.error("You must be logged in to complete onboarding.");
        },
        OrElse: () => {
          toast.error("An unexpected error occurred. Please try again.");
        },
      });
    },
    onSuccess: async () => {
      // Reload user to ensure publicMetadata is fresh
      await user?.reload();
      const role =
        selectedUserType ??
        ((user?.publicMetadata as Record<string, unknown>)?.role as
          | "explorer"
          | "business"
          | undefined);
      window.location.replace(role === "business" ? routes.business.root : routes.explorer.root);
    },
  });

  const form = useForm({
    defaultValues: {
      userType: "" as "explorer" | "business",
      fullName: user?.fullName || "",
    },
    validators: {
      onSubmit: Schema.standardSchemaV1(OnboardUserPayload),
    },
    onSubmit: async ({ value }) => {
      onBoardUser(value);
    },
  });

  return { form, isPending, selectedUserType, setSelectedUserType };
}
