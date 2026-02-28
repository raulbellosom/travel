import { useInstanceModulesContext } from "../contexts/InstanceModulesContext";

/**
 * Thin wrapper around InstanceModulesContext.
 * All state and fetching lives in InstanceModulesProvider (mounted once at the
 * app root inside AuthProvider) so every consumer shares the same data with no
 * duplicate fetches and no flash from stale defaults.
 */
export const useInstanceModules = () => useInstanceModulesContext();
