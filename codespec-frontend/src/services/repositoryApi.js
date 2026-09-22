import api from "./api";

export const repositoryApi = {
    getRepositories: () => api.get("/repos"),
};

export default repositoryApi;
