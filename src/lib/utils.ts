export function cn(...cls: Array<string | undefined | false | null>) {
  return cls.filter(Boolean).join(" ");
}
