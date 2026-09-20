import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";

const schema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  slug: z
    .string()
    .min(2, "Minimum 2 caractères")
    .regex(
      /^[a-z0-9-]+$/,
      "Uniquement des lettres minuscules, chiffres et tirets",
    ),
});

type FormData = z.infer<typeof schema>;

export default function CreateEstablishmentPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post("/establishments", data);
      const { accessToken, refreshToken, ...establishment } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      if (user) {
        setAuth({
          user,
          accessToken,
          refreshToken,
          establishmentId: establishment.id,
          role: "DIRECTOR",
        });
      }

      navigate("/dashboard");
    } catch (error: any) {
      setError("root", {
        message:
          error.response?.data?.message ||
          "Erreur lors de la création de l'établissement",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Créer votre établissement
          </h1>
          <p className="mt-2 text-gray-600">
            Pour commencer à utiliser Skools, créez votre établissement
            scolaire.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom de l'établissement
            </label>
            <input
              {...register("name")}
              placeholder="Ex: Lycée Moderne de Cocody"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Identifiant (slug)
            </label>
            <input
              {...register("slug")}
              placeholder="Ex: lycee-moderne-cocody"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Utilisé dans les URLs. Uniquement lettres minuscules, chiffres et
              tirets.
            </p>
          </div>

          {errors.root && (
            <p className="text-sm text-red-600 text-center">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Création..." : "Créer mon établissement"}
          </button>
        </form>
      </div>
    </div>
  );
}
