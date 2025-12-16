"use client";

import { MapPinIcon, StoreIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormActions } from "./FormActions";
import { useOnboardingForm } from "./useOnboardingForm";

export function OnboardingForm() {
  const { form, isPending, selectedUserType, setSelectedUserType } =
    useOnboardingForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <Card className="shadow-2xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Complete your profile</CardTitle>
        <CardDescription>
          Just a few quick details to get you started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            {/* User Type Selection */}
            <form.Field name="userType">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <FieldSet>
                    <FieldLegend variant="label">I want to...</FieldLegend>
                    <FieldDescription>
                      Choose how you&apos;ll use Lieou
                    </FieldDescription>
                    <RadioGroup
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value as "explorer" | "business");
                        setSelectedUserType(value as "explorer" | "business");
                      }}
                      disabled={isPending}
                    >
                      <FieldLabel
                        htmlFor="usertype-explorer"
                        className="cursor-pointer"
                      >
                        <Field
                          orientation="horizontal"
                          data-invalid={isInvalid}
                        >
                          <FieldContent>
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-500">
                                <MapPinIcon className="size-5 text-white" />
                              </div>
                              <div>
                                <FieldTitle>Explore places</FieldTitle>
                                <FieldDescription>
                                  Discover new spots and experiences
                                </FieldDescription>
                              </div>
                            </div>
                          </FieldContent>
                          <RadioGroupItem
                            value="explorer"
                            id="usertype-explorer"
                            aria-invalid={isInvalid}
                          />
                        </Field>
                      </FieldLabel>

                      <FieldLabel
                        htmlFor="usertype-business"
                        className="cursor-pointer"
                      >
                        <Field
                          orientation="horizontal"
                          data-invalid={isInvalid}
                        >
                          <FieldContent>
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500">
                                <StoreIcon className="size-5 text-white" />
                              </div>
                              <div>
                                <FieldTitle>Showcase my business</FieldTitle>
                                <FieldDescription>
                                  Reach explorers and grow your audience
                                </FieldDescription>
                              </div>
                            </div>
                          </FieldContent>
                          <RadioGroupItem
                            value="business"
                            id="usertype-business"
                            aria-invalid={isInvalid}
                          />
                        </Field>
                      </FieldLabel>
                    </RadioGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldSet>
                );
              }}
            </form.Field>

            {/* Full Name Field */}
            {selectedUserType && (
              <form.Field name="fullName">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                      <Input
                        id="fullName"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="John Doe"
                        autoComplete="name"
                        disabled={isPending}
                      />
                      <FieldDescription>
                        This is how you&apos;ll appear on Lieou
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}
          </FieldGroup>

          <FormActions
            selectedUserType={selectedUserType}
            onReset={() => form.reset()}
            isLoading={isPending}
          />
        </form>
      </CardContent>
    </Card>
  );
}
