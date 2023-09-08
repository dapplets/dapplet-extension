import * as nearAPI from 'near-api-js'
import { ChainTypes, DefaultSigners, MutationRecord } from '../../common/types'
import { WalletService } from './walletService'

const EXCLUDED_MUTATION_IDS = ['dapplets.near/community', 'alsakhaev.near/nft-everywhere']

export default class MutationRegistryService {
  _testnetContract: nearAPI.Contract

  constructor(private _walletService: WalletService) {}

  private _createContract = (near_account: nearAPI.Account, contractAddress: string) =>
    new nearAPI.Contract(near_account, contractAddress, {
      viewMethods: ['get_all_mutations', 'get_mutation', 'get_mutations_by_author'],
      changeMethods: ['create_mutation', 'update_mutation'],
    })

  private async _getContract() {
    const contractNetwork = 'mainnet'
    switch (contractNetwork) {
      case 'mainnet':
        if (!this._testnetContract) {
          const contractAddress = 'mutations.dapplets.near'
          const near_account = await this._walletService.near_getAccount(
            DefaultSigners.EXTENSION,
            ChainTypes.NEAR_MAINNET
          )
          this._testnetContract = this._createContract(near_account, contractAddress)
        }
        return this._testnetContract
    }
  }

  // ***** VIEW *****

  public async getAllMutations(): Promise<MutationRecord[]> {
    const contract = await this._getContract()
    const mutations = await contract['get_all_mutations']()
    return mutations
      .map((mutation) => ({
        id: mutation[0] + '/' + mutation[1],
        description: mutation[2].description,
        overrides: Object.fromEntries(
          mutation[2].overrides.map((override) => [override.from_src, override.to_src])
        ),
      }))
      .filter((mutation) => !EXCLUDED_MUTATION_IDS.includes(mutation.id))
  }

  public async getMutationById(id: string): Promise<MutationRecord | null> {
    const [authorId, mutationId] = id.split('/')
    const contract = await this._getContract()
    const mutation = await contract['get_mutation']({
      mutation_id: mutationId,
      author_id: authorId,
    })
    if (!mutation) return null

    return {
      id,
      description: mutation.description,
      overrides: Object.fromEntries(
        mutation.overrides.map((override) => [override.from_src, override.to_src])
      ),
    }
  }

  public async getMutationsByAuthor(authorId: string): Promise<MutationRecord[]> {
    const contract = await this._getContract()
    const mutations = await contract['get_mutations_by_author']({ author_id: authorId })
    return mutations.map((mutation) => ({
      id: authorId + '/' + mutation[0],
      description: mutation[1].description,
      overrides: Object.fromEntries(
        mutation[1].overrides.map((override) => [override.from_src, override.to_src])
      ),
    }))
  }

  // ***** CALL *****

  public async createMutation(mutation: MutationRecord): Promise<void> {
    const [authorId, mutationId] = mutation.id.split('/')
    const contract = await this._getContract()
    await contract['create_mutation']({
      author_id: authorId,
      mutation_id: mutationId,
      description: mutation.description,
      overrides: Object.entries(mutation.overrides).map(([from_src, to_src]) => ({
        from_src,
        to_src,
      })),
    })
  }

  public async updateMutation(
    mutation: Pick<MutationRecord, 'id'> & Partial<MutationRecord>
  ): Promise<void> {
    const [authorId, mutationId] = mutation.id.split('/')
    const contract = await this._getContract()
    await contract['update_mutation']({
      author_id: authorId,
      mutation_id: mutationId,
      description: mutation.description,
      overrides: mutation.overrides
        ? Object.entries(mutation.overrides)
            .map(([from_src, to_src]) => ({
              from_src,
              to_src,
            }))
            .filter((x) => x.to_src)
        : null,
    })
  }
}
