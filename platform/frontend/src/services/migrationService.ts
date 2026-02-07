import axios from 'axios';
import { Migration, MigrationRequest } from '@/types/migration.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class MigrationService {
  private axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Create a new migration
   */
  async createMigration(request: MigrationRequest): Promise<Migration> {
    // Use the repo-migration endpoint for local repositories
    const response = await this.axiosInstance.post('/api/repo-migration/analyze-and-generate', {
      repoPath: request.repoUrl
    });
    return response.data;
  }

  /**
   * Get migration by ID
   */
  async getMigration(id: string): Promise<Migration> {
    const response = await this.axiosInstance.get(`/api/migrations/${id}`);
    return response.data;
  }

  /**
   * Get all migrations
   */
  async getAllMigrations(): Promise<Migration[]> {
    const response = await this.axiosInstance.get('/api/migrations');
    return response.data;
  }

  /**
   * Get list of files in migration output
   */
  async getOutputFiles(id: string): Promise<string[]> {
    const response = await this.axiosInstance.get(`/api/migrations/${id}/files`);
    return response.data;
  }

  /**
   * Read file content from output
   */
  async readFile(id: string, filePath: string): Promise<string> {
    const response = await this.axiosInstance.get(`/api/migrations/${id}/file`, {
      params: { path: filePath },
    });
    return response.data;
  }

  /**
   * Get download URL for migration output
   */
  getDownloadUrl(id: string): string {
    return `${API_URL}/api/migrations/${id}/download`;
  }

  /**
   * Download migration output as ZIP
   */
  async downloadOutput(id: string): Promise<void> {
    const url = this.getDownloadUrl(id);
    window.open(url, '_blank');
  }

  /**
   * Deploy migration to OpenShift
   */
  async deployToOpenShift(id: string, namespace?: string): Promise<any> {
    const response = await this.axiosInstance.post(`/api/repo-migration/deploy/${id}`);
    return response.data;
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(id: string): Promise<any> {
    const response = await this.axiosInstance.get(`/api/migrations/${id}/deployment`);
    return response.data;
  }
}

export default new MigrationService();
