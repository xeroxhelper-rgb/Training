export function isDemoMode(value = process.env.NEXT_PUBLIC_DEMO_MODE) {
  return value !== "false";
}

export function getSafeNextPath(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
