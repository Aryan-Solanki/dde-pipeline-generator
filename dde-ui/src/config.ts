// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export const config = {
  apiUrl: API_URL,
  endpoints: {
    chat: `${API_URL}/api/chat`,
    chatStream: `${API_URL}/api/chat/stream`,
    pipelineGenerate: `${API_URL}/api/pipeline/generate`,
    pipelineRefineSpec: `${API_URL}/api/pipeline/refine-spec`,
    pipelineRefineCode: `${API_URL}/api/pipeline/refine-code`,
    pipelineFix: `${API_URL}/api/pipeline/fix`,
    pipelineRepair: `${API_URL}/api/pipeline/repair`,
    pipelineGenerateCode: `${API_URL}/api/pipeline/generate-code`,
    pipelineExport: `${API_URL}/api/pipeline/export`,
    filesUpload: `${API_URL}/api/files/upload`,
    filesParseRequirements: `${API_URL}/api/files/parse-requirements`,
  }
};

export default config;
