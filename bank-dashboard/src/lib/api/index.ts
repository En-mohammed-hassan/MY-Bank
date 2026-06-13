export { ApiError, apiFetch } from "./client";
export { usersApiBase, usersFetch } from "./users-api";
export { coreApiBase, coreFetch } from "./core-api";
export { customerApiBase, customerFetch } from "./customer-api";

// Backward-compatible aliases
export { usersApiBase as usersApi } from "./users-api";
export { coreApiBase as coreApi } from "./core-api";
export { customerApiBase as customerApi } from "./customer-api";
