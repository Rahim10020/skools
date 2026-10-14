import { API } from "../../lib/api-endpoints";
import { ROUTES } from "../../lib/routes";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import type { LoginResponse } from "../../types/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AuthField, AuthRootError } from "./components/AuthField";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (isAuthenticated()) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await api.post<LoginResponse>(API.authLogin, data);
      const { user, accessToken, refreshToken, establishmentId, role } = response.data;

      // Changement de session : purger le cache (données d'un autre compte/établissement).
      queryClient.clear();
      setAuth({ user, accessToken, refreshToken, establishmentId, role });

      navigate(ROUTES.dashboard);
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <div className="flex flex-col gap-p5">
      <div className="text-center md:text-left">
        <h1 className="text-dp20 sm:text-dp24 text-(--skools-text-primary)">
          Bon retour parmi nous
        </h1>
        <p className="mt-p1 text-r14 text-(--skools-text-muted)">
          Connectez-vous à votre compte Skools
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-p4" noValidate>
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
                autoComplete="current-password"
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
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <p className="text-center text-r14 text-(--skools-text-muted)">
        Pas encore de compte ?{" "}
        <Link
          to={ROUTES.register}
          className="font-medium text-(--common-blue) hover:underline"
        >
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
