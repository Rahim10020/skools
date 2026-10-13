import type { ComponentType, SVGProps } from "react";

export type SkoolsIconProps = SVGProps<SVGSVGElement> & {
  /** Taille en px (appliquée via style, prioritaire sur les attributs width/height). */
  size?: number;
};

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface IconProps extends SVGProps<SVGSVGElement> {
  component: IconComponent;
  size?: number;
}

/**
 * Wrapper homogène pour les icônes SVG portées d'EPL.
 * `size` passe par le style inline : il gagne sur les attributs
 * width/height codés en dur dans les SVG d'origine.
 */
export function Icon({ component: C, size = 20, style, ...props }: IconProps) {
  return <C {...props} style={{ width: size, height: size, ...style }} />;
}
