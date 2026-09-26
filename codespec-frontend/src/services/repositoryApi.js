import api from "./api";

export const repositoryApi = {
    getRepositories: async () => {
        try {
            const response = await api.get("/repos");
            return response.data;
        } catch (error) {
            console.warn("Backend /api/repos unavailable, using store cache", error);
            throw error;
        }
    },

    importGitRepository: async (repoData) => {
        try {
            const response = await api.post("/repos", repoData);
            return response.data;
        } catch (error) {
            console.warn("Backend /api/repos unavailable, handling in-memory", error);
            throw error;
        }
    },

    uploadZipRepository: async (formData) => {
        try {
            const response = await api.post("/repos/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.warn("Backend /api/repos/upload unavailable, handling in-memory", error);
            throw error;
        }
    },
};

export default repositoryApi;
