export const INPUT_BASE =
  "flex w-full h-(--size-s10) items-center rounded-(--radius-r2) text-r14 leading-none outline-none text-(--skools-text-primary)";

export const BG_NORMAL = "bg-(--skools-elevated-bg)";
export const BG_ERROR = "bg-(--common-red-5)";

export function getBg(isError: boolean) {
  return isError ? BG_ERROR : BG_NORMAL;
}
