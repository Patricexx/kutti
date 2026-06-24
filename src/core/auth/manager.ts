/**
 * Authentication manager - handles login, logout, and credential validation
 */

import { credentialStorage } from './storage';
import { sessionManager } from './session';
import { providerRegistry } from '../providers/registry';
import { ProviderConfig } from '../providers/base';

export interface LoginOptions {
  provider: string;
  apiKey: string;
  config?: ProviderConfig;
  saveSession?: boolean;
}

export interface LoginResult {
  success: boolean;
  provider: string;
  message: string;
  error?: string;
}

/**
 * Authentication manager
 */
export class AuthManager {
  /**
   * Login to a provider
   */
  async login(options: LoginOptions): Promise<LoginResult> {
    const { provider, apiKey, config, saveSession = true } = options;

    try {
      // Validate credentials
      const providerInstance = providerRegistry.get(provider, apiKey, config);
      if (!providerInstance) {
        return {
          success: false,
          provider,
          message: `Provider ${provider} not found`,
          error: 'PROVIDER_NOT_FOUND',
        };
      }

      const isValid = await providerInstance.validateCredentials();
      if (!isValid) {
        return {
          success: false,
          provider,
          message: `Invalid credentials for ${provider}`,
          error: 'INVALID_CREDENTIALS',
        };
      }

      // Save credentials
      await credentialStorage.saveApiKey(provider, apiKey);

      // Save session
      if (saveSession) {
        const models = await providerInstance.listModels();
        const defaultModel = models[0]?.id || 'default';
        await sessionManager.setActiveProvider(provider, defaultModel);
      }

      return {
        success: true,
        provider,
        message: `Successfully authenticated with ${provider}`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        provider,
        message: `Login failed: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }

  /**
   * Logout from a provider
   */
  async logout(provider: string): Promise<LoginResult> {
    try {
      await credentialStorage.deleteApiKey(provider);

      const activeProvider = await sessionManager.getActiveProvider();
      if (activeProvider === provider) {
        await sessionManager.clear();
      }

      return {
        success: true,
        provider,
        message: `Successfully logged out from ${provider}`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        provider,
        message: `Logout failed: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }

  /**
   * Get authentication status
   */
  async getStatus(): Promise<{
    activeProvider: string;
    activeModel: string;
    authenticatedProviders: string[];
  }> {
    const activeProvider = await sessionManager.getActiveProvider();
    const activeModel = await sessionManager.getActiveModel();
    const authenticatedProviders = await credentialStorage.listProviders();

    return {
      activeProvider,
      activeModel,
      authenticatedProviders,
    };
  }

  /**
   * Get provider instance with loaded credentials
   */
  async getProvider(providerName?: string, config?: ProviderConfig) {
    const provider = providerName || (await sessionManager.getActiveProvider());
    const apiKey = await credentialStorage.loadApiKey(provider);

    if (!apiKey) {
      throw new Error(`No credentials found for provider: ${provider}`);
    }

    const providerInstance = providerRegistry.get(provider, apiKey, config);
    if (!providerInstance) {
      throw new Error(`Provider not found: ${provider}`);
    }

    return providerInstance;
  }

  /**
   * Switch active provider
   */
  async switchProvider(provider: string, model?: string): Promise<LoginResult> {
    try {
      const apiKey = await credentialStorage.loadApiKey(provider);
      if (!apiKey) {
        return {
          success: false,
          provider,
          message: `Not authenticated with ${provider}`,
          error: 'NOT_AUTHENTICATED',
        };
      }

      const providerInstance = providerRegistry.get(provider, apiKey);
      if (!providerInstance) {
        return {
          success: false,
          provider,
          message: `Provider not found: ${provider}`,
          error: 'PROVIDER_NOT_FOUND',
        };
      }

      let selectedModel = model;
      if (!selectedModel) {
        const models = await providerInstance.listModels();
        selectedModel = models[0]?.id || 'default';
      }

      await sessionManager.setActiveProvider(provider, selectedModel);

      return {
        success: true,
        provider,
        message: `Switched to ${provider} (${selectedModel})`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        provider,
        message: `Provider switch failed: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }
}

export const authManager = new AuthManager();
