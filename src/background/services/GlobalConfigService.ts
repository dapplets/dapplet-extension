import GlobalConfigRepository from '../repositories/GlobalConfigRepository';
import GlobalConfig from '../models/GlobalConfig';

export default class GlobalConfigService {
    private _globalConfigRepository = new GlobalConfigRepository();
    private _configId: string = 'default';

    async get(): Promise<GlobalConfig> {
        let config = await this._globalConfigRepository.getById(this._configId);
        if (!config) await this.resetConfig();
        config = await this._globalConfigRepository.getById(this._configId);

        return config;
    }

    async set(config: GlobalConfig): Promise<void> {
        await this._globalConfigRepository.update(config);
    }

    async resetConfig(): Promise<void> {
        const config = new GlobalConfig();
        config.id = this._configId;
        
        await this._globalConfigRepository.deleteById(this._configId);
        await this._globalConfigRepository.create(config);
    }
}