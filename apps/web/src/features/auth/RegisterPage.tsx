import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import type { RegisterResponse } from "../../types/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AuthField, AuthRootError } from "./components/AuthField";

const registerSchema = z.object({
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: RegisterForm) => {
    try {
      const response = await api.post<RegisterResponse>("/auth/register", data);
      const { user, accessToken, refreshToken } = response.data;

      // Contrat : register ne renvoie ni establishmentId ni role.
      queryClient.clear();
      setAuth({ user, accessToken, refreshToken, establishmentId: null, role: null });

      // Sans établissement : RequireEstablishment + Dashboard redirigent vers la création.
      navigate("/dashboard");
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <div className="flex flex-col gap-p5">
      <div className="text-center md:text-left">
        <h1 className="text-dp20 sm:text-dp24 text-(--skools-text-primary)">
          Créer votre compte
        </h1>
        <p className="mt-p1 text-r14 text-(--skools-text-muted)">
          Rejoignez Skools en quelques secondes
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-p4" noValidate>
        <div className="grid grid-cols-2 gap-p4">
          <Controller
            name="firstName"
            control={control}
            render={({ field: { value, onChange, onBlur, name }, fieldState }) => (
              <AuthField label="Prénom" error={fieldState.error?.message}>
                <Input
                  label="Awa"
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={!!fieldState.error}
                  autoComplete="given-name"
                />
              </AuthField>
            )}
          />

          <Controller
            name="lastName"
            control={control}
            render={({ field: { value, onChange, onBlur, name }, fieldState }) => (
              <AuthField label="Nom" error={fieldState.error?.message}>
                <Input
                  label="Diallo"
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={!!fieldState.error}
                  autoComplete="family-name"
                />
              </AuthField>
            )}
          />
        </div>

        <Controller
          name="email"
          control={control}
          render={({ field: { value, onChange, onBlur, name }, fieldState }) => (
            <AuthField label="Email" error={fieldState.error?.message}>
              <Input
                label="adresse@exemple.com"
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                error={!!fieldState.error}
                autoComplete="email"
              />
            </AuthField>
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field: { value, onChange, onBlur, name }, fieldState }) => (
            <AuthField label="Mot de passe" error={fieldState.error?.message}>
              <Input
                variant="password"
                label="8 caractères minimum"
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                error={!!fieldState.error}
                autoComplete="new-password"
              />
            </AuthField>
          )}
        />

        <AuthRootError message={errors.root?.message} />

        <Button
          type="submit"
          variant={isSubmitting ? "loading" : "primary"}
          disabled={isSubmitting}
          iconPushed={!isSubmitting}
        >
          {isSubmitting ? "Inscription…" : "S'inscrire"}
        </Button>
      </form>

      <p className="text-center text-r14 text-(--skools-text-muted)">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-medium text-(--common-blue) hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
