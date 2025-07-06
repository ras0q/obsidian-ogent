// Private apis
declare module "npm:obsidian" {
  interface App {
    loadLocalStorage(key: string): string | null;
    saveLocalStorage(key: string, value: string | undefined): void;
  }
}
