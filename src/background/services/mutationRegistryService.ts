import * as nearAPI from 'near-api-js'
import { ChainTypes, DefaultSigners, MutationRecord } from '../../common/types'
import { WalletService } from './walletService'

export default class MutationRegistryService {
  _testnetContract: nearAPI.Contract

  constructor(private _walletService: WalletService) {}

  private _createContract = (near_account: nearAPI.Account, contractAddress: string) =>
    new nearAPI.Contract(near_account, contractAddress, {
      viewMethods: ['get_all_mutations', 'get_mutation', 'get_mutations_by_author'],
      changeMethods: ['create_mutation', 'update_mutation'],
    })

  private async _getContract() {
    const contractNetwork = 'testnet'
    switch (contractNetwork) {
      case 'testnet':
        if (!this._testnetContract) {
          const contractAddress = 'dev-1694040644977-75002385830517'
          const near_account = await this._walletService.near_getAccount(
            DefaultSigners.EXTENSION,
            ChainTypes.NEAR_TESTNET
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
    return mutations.map((mutation) => ({
      authorId: mutation[0],
      mutationId: mutation[1],
      description: mutation[2].description,
      overrides: mutation[2].overrides.map((override) => ({
        fromSrc: override.from_src,
        toSrc: override.to_src,
      })),
    }))
  }

  public async getMutation(authorId: string, mutationId: string): Promise<MutationRecord | null> {
    const contract = await this._getContract()
    const mutation = await contract['get_mutation']({
      mutation_id: mutationId,
      author_id: authorId,
    })
    if (!mutation) return null

    return {
      authorId,
      mutationId,
      description: mutation.description,
      overrides: mutation.overrides.map((override) => ({
        fromSrc: override.from_src,
        toSrc: override.to_src,
      })),
    }
  }

  public async getMutationsByAuthor(authorId: string): Promise<MutationRecord[]> {
    const contract = await this._getContract()
    const mutations = await contract['get_mutations_by_author']({ author_id: authorId })
    return mutations.map((mutation) => ({
      authorId: authorId,
      mutationId: mutation[0],
      description: mutation[1].description,
      overrides: mutation[1].overrides.map((override) => ({
        fromSrc: override.from_src,
        toSrc: override.to_src,
      })),
    }))
  }

  // ***** CALL *****

  public async createMutation(record: MutationRecord): Promise<void> {
    const contract = await this._getContract()
    await contract['create_mutation']({
      mutation_id: record.mutationId,
      description: record.description,
      overrides: record.overrides.map((override) => ({
        from_src: override.fromSrc,
        to_src: override.toSrc,
      })),
    })
  }

  public async updateMutation(
    record: Pick<MutationRecord, 'authorId' | 'mutationId'> & Partial<MutationRecord>
  ): Promise<void> {
    const contract = await this._getContract()
    await contract['update_mutation']({
      mutation_id: record.mutationId,
      description: record.description,
      overrides: record.overrides?.map((override) => ({
        from_src: override.fromSrc,
        to_src: override.toSrc,
      })),
    })
  }
}
